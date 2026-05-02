import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  MdSave, MdFileDownload, MdEvent, MdEmojiEvents, MdCloudDone, MdLocalShipping, MdHistory, MdFilterList, MdAgriculture
} from 'react-icons/md';
import * as XLSX from 'xlsx';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

const LS_KEY = 'workerProductivityGrid';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safe localStorage read */
const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Safe localStorage write */
const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
};

/** Build a flat key from workerId + supplierId + ISO date string */
const cellKey = (workerId, supplierId, date) => `${workerId}||${supplierId}||${date}`;

/** Parse a flat key back into { workerId, supplierId, date } */
const parseKey = (key) => {
  const [workerId, supplierId, date] = key.split('||');
  return { workerId, supplierId, date };
};

// ── Component ─────────────────────────────────────────────────────────────────

const WorkerProductivity = () => {
  const [workers, setWorkers]           = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]  = useState(new Date().getFullYear());
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  
  // Date Range Filters (Defaults to full month)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  /**
   * gridData — single source of truth for the entire grid.
   * Shape: { "workerId||supplierId||YYYY-MM-DD": "value_string" }
   */
  const [gridData, setGridData] = useState(() => lsGet(LS_KEY) || {});
  const [isDirty, setIsDirty]   = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // For the report view
  const [report, setReport] = useState(null);
  const [fetchingReport, setFetchingReport] = useState(false);

  // Days in the selected month
  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth, 0).getDate(),
    [selectedMonth, selectedYear]
  );

  // Reset date range when month/year changes
  useEffect(() => {
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(start);
    setEndDate(end);
  }, [selectedMonth, selectedYear]);

  // ── Auto-save to localStorage on every gridData change ────────────────────
  useEffect(() => {
    lsSet(LS_KEY, gridData);
  }, [gridData]);

  // ── Fetch workers, suppliers + DB logs ────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedSupplierId) {
      // Just fetch lists if no supplier selected
      setLoading(true);
      try {
        const [w, s] = await Promise.all([api.get('/workers'), api.get('/suppliers')]);
        setWorkers(w.data.data);
        setSuppliers(s.data.data);
      } catch { toast.error('Failed to load lists'); }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [workersRes, suppliersRes, logsRes] = await Promise.all([
        api.get('/workers'),
        api.get('/suppliers'),
        api.get(`/worker-daily?month=${selectedMonth}&year=${selectedYear}&supplier_id=${selectedSupplierId}`)
      ]);

      setWorkers(workersRes.data.data);
      setSuppliers(suppliersRes.data.data);

      setGridData(prev => {
        const merged = { ...prev };
        logsRes.data.data.forEach(log => {
          const k = cellKey(log.worker_id, log.supplier_id, log.date);
          merged[k] = String(log.quantity_processed || '');
        });
        return merged;
      });

    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedSupplierId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchReport = async () => {
    if (!selectedSupplierId || !startDate || !endDate) {
      toast.warn('Select supplier and date range');
      return;
    }
    setFetchingReport(true);
    try {
      const res = await api.get(`/worker-daily/report?supplier_id=${selectedSupplierId}&from_date=${startDate}&to_date=${endDate}`);
      setReport(res.data.data);
    } catch {
      toast.error('Failed to fetch report');
    } finally {
      setFetchingReport(false);
    }
  };

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleInputChange = (workerId, day, value) => {
    if (!selectedSupplierId) { toast.warn('Select a supplier first'); return; }
    
    // Reject non-numeric and negative values (allow empty for clearing)
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) return;

    const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const k = cellKey(workerId, selectedSupplierId, date);

    setGridData(prev => ({ ...prev, [k]: value }));
    setIsDirty(true);
  };

  // ── Save to DB ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isDirty || !selectedSupplierId) return;

    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    // Filter by currently selected supplier and current month
    const toSave = Object.entries(gridData).filter(([k]) => {
      const { supplierId, date } = parseKey(k);
      return supplierId === String(selectedSupplierId) && date.startsWith(prefix);
    });

    if (toSave.length === 0) { setIsDirty(false); return; }

    try {
      await Promise.all(
        toSave.map(([k, val]) => {
          const { workerId, supplierId, date } = parseKey(k);
          const qty = parseFloat(val);
          if (!workerId || !supplierId || !date || isNaN(qty)) return Promise.resolve();
          return api.post('/worker-daily', {
            worker_id: workerId,
            supplier_id: supplierId,
            date,
            quantity_processed: qty
          });
        })
      );
      toast.success('Saved to database!');
      setIsDirty(false);
      setLastSaved(new Date());
      fetchReport(); // Refresh report if visible
    } catch {
      toast.error('Failed to save data');
    }
  };

  // ── Real-time stats (based on current filters) ───────────────────────────
  const stats = useMemo(() => {
    const workerStats = workers.map(w => {
      let total = 0;
      let count = 0;
      
      // Calculate start and end day from current date filters
      const startDay = (startDate && startDate.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`))
        ? parseInt(startDate.split('-')[2]) : 1;
      const endDay = (endDate && endDate.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`))
        ? parseInt(endDate.split('-')[2]) : daysInMonth;

      for (let day = startDay; day <= endDay; day++) {
        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const val = gridData[cellKey(w.id, selectedSupplierId, date)];
        if (val && !isNaN(val)) total += parseFloat(val);
        count++;
      }
      return { id: w.id, name: w.name, total, salary: total * 26 };
    });

    const sorted = [...workerStats].sort((a, b) => b.total - a.total);
    return {
      byId: workerStats.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
      topWorkers: sorted.slice(0, 3),
      highest: sorted[0]?.total > 0 ? sorted[0].id : null,
      lowest: sorted.length > 1 && sorted[sorted.length - 1]?.total > 0
        ? sorted[sorted.length - 1].id : null,
      totalQty: workerStats.reduce((s, w) => s + w.total, 0)
    };
  }, [workers, gridData, daysInMonth, selectedMonth, selectedYear, selectedSupplierId, startDate, endDate]);

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const rows = workers.map(w => {
      const row = { 'Worker Name': w.name };
      const startDay = startDate ? parseInt(startDate.split('-')[2]) : 1;
      const endDay = endDate ? parseInt(endDate.split('-')[2]) : daysInMonth;

      for (let i = startDay; i <= endDay; i++) {
        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        row[`Day ${i}`] = parseFloat(gridData[cellKey(w.id, selectedSupplierId, date)]) || 0;
      }
      row['Total']   = stats.byId[w.id]?.total.toFixed(1) || 0;
      row['Salary']  = stats.byId[w.id]?.salary.toFixed(2) || 0;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productivity');
    XLSX.writeFile(wb, `Worker_Productivity_${selectedSupplierId}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="productivity-page">
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green-900)', marginBottom: '4px' }}>
            Daily Worker Productivity
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Track and analyze cashew processing output across workers and suppliers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ height: '42px', padding: '0 20px', gap: 8 }} onClick={exportToExcel}>
            <MdFileDownload size={18} /> Export Excel
          </button>
          <button className="btn btn-primary" style={{ height: '42px', padding: '0 24px', gap: 8 }}
            onClick={handleSave} disabled={!isDirty || !selectedSupplierId}>
            <MdSave size={18} /> {isDirty ? 'Sync Changes' : 'Data Synced'}
          </button>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className="card shadow-sm" style={{ marginBottom: 24, border: 'none' }}>
        <div className="card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.5fr', gap: '20px', alignItems: 'flex-end' }}>
            
            <div className="filter-group">
              <label className="filter-label"><MdLocalShipping /> Selection</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-control" value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  style={{ flex: 1.5, height: '42px' }}>
                  <option value="">Choose Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="form-control" value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  style={{ flex: 1.2, height: '42px' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>
                  ))}
                </select>
                <select className="form-control" value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  style={{ flex: 1, height: '42px' }}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label"><MdEvent /> Date Range Filter</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" className="form-control" value={startDate} 
                  onChange={e => setStartDate(e.target.value)} style={{ height: '42px' }} />
                <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>to</span>
                <input type="date" className="form-control" value={endDate} 
                  onChange={e => setEndDate(e.target.value)} style={{ height: '42px' }} />
              </div>
            </div>

            <div className="filter-group">
               <button className="btn btn-secondary w-full" style={{ height: '42px', gap: 8 }} 
                  onClick={fetchReport} disabled={!selectedSupplierId}>
                <MdHistory size={18} /> View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Leaderboard Section */}
      <div className="insight-grid" style={{ marginBottom: 24 }}>
        
        {/* Top Performers Card */}
        <div className="card glass-card" style={{ border: 'none' }}>
          <div className="card-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
              <MdEmojiEvents color="#FFD700" size={22} /> Top Output Performers
            </h3>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            {stats.topWorkers.length === 0
              ? <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No data for current filters</div>
              : stats.topWorkers.map((w, idx) => (
                <div key={w.id} className="premium-leaderboard-item">
                  <div className={`leader-rank rank-${idx + 1}`}>{idx + 1}</div>
                  <div className="leader-info">
                    <span className="leader-name">{w.name}</span>
                    <span className="leader-avg">Salary ₹{w.salary.toLocaleString()}</span>
                  </div>
                  <div className="leader-value">
                    <span>{w.total.toFixed(1)}</span>
                    <small>kg</small>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Filter Summary Visual Card */}
        <div className="card summary-card" style={{ border: 'none', background: 'var(--green-900)', color: 'white' }}>
          <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="summary-row">
              <span className="label">SUPPLIER</span>
              <span className="val">{suppliers.find(s => s.id == selectedSupplierId)?.name || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span className="label">PERIOD</span>
              <span className="val">{selectedMonth}/{selectedYear}</span>
            </div>
            <div className="summary-row">
              <span className="label">ACTIVE DAYS</span>
              <span className="val">{startDate.split('-')[2]} to {endDate.split('-')[2]}</span>
            </div>
            
            <div className="total-badge">
              <div className="total-label">TOTAL QUANTITY PROCESSED</div>
              <div className="total-val">
                <MdAgriculture size={28} />
                <span>{stats.totalQty.toLocaleString('en-IN', { minimumFractionDigits: 1 })} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save & Status Bar */}
      <div className="status-bar">
        <div className="auto-save-hint">
          <MdCloudDone size={18} />
          <span>Real-time local backup active. Sync to DB to finalize.</span>
        </div>
        {lastSaved && (
          <div className="last-sync-tag">
            Last server sync: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Grid Table */}
      {!selectedSupplierId ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <MdLocalShipping size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>Please select a supplier to view and edit productivity</h3>
          <p>Productivity is tracked per supplier to ensure accurate lot processing.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="productivity-table-container">
                <table className="productivity-table">
                  <thead>
                    <tr>
                      <th className="sticky-col-sno">S.NO</th>
                      <th className="sticky-col-name">WORKER NAME</th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isInRange = (!startDate || date >= startDate) && (!endDate || date <= endDate);
                        return (
                          <th key={day} className="date-th" style={!isInRange ? { opacity: 0.3, background: '#f5f5f5' } : {}}>
                            {day}
                          </th>
                        );
                      })}
                      <th className="stats-header">TOTAL (KG)</th>
                      <th className="stats-header">SALARY (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w, idx) => {
                      const s = stats.byId[w.id];
                      const isHighest = w.id === stats.highest;
                      const isLowest  = w.id === stats.lowest;
                      
                      return (
                        <tr key={w.id} className={`${isHighest ? 'row-highest' : ''} ${isLowest ? 'row-lowest' : ''}`}>
                          <td className="sticky-col-sno">{idx + 1}</td>
                          <td className="sticky-col-name">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isHighest && <MdEmojiEvents color="#FFD700" size={14} title="Highest Output" />}
                              {w.name}
                            </div>
                          </td>

                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day  = i + 1;
                            const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const val  = gridData[cellKey(w.id, selectedSupplierId, date)] ?? '';
                            const isInRange = (!startDate || date >= startDate) && (!endDate || date <= endDate);

                            return (
                              <td key={day} className="input-cell" style={!isInRange ? { background: '#f9f9f9' } : {}}>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={val}
                                  placeholder={isInRange ? "0" : "—"}
                                  disabled={!isInRange}
                                  onChange={e => handleInputChange(w.id, day, e.target.value)}
                                />
                              </td>
                            );
                          })}

                          <td className="font-bold text-right total-col">
                            {s?.total.toFixed(1) ?? '0.0'}
                          </td>
                          <td className="text-muted text-right avg-col" style={{ fontWeight: 700, color: 'var(--green-800)' }}>
                            ₹{s?.salary.toLocaleString(undefined, { minimumFractionDigits: 1 }) ?? '0.0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="factory-total-row">
                      <td colSpan={2} className="sticky-total-label">
                        FACTORY GRAND TOTAL
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        let dayTotal = 0;
                        workers.forEach(w => {
                           const val = gridData[cellKey(w.id, selectedSupplierId, date)];
                           if (val && !isNaN(val)) dayTotal += parseFloat(val);
                        });
                        return <td key={day} className="day-sum">{dayTotal > 0 ? dayTotal.toFixed(1) : '—'}</td>;
                      })}
                      <td className="grand-qty">{stats.totalQty.toFixed(1)}</td>
                      <td className="grand-salary">
                        ₹{workers.reduce((sum, w) => sum + (stats.byId[w.id]?.salary || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {report && (
        <div className="modal-overlay" onClick={() => setReport(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><MdHistory /> Detailed Breakdown</h3>
              <button className="modal-close" onClick={() => setReport(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '16px', background: 'var(--green-50)', borderRadius: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Supplier:</span>
                  <span>{suppliers.find(s => s.id == selectedSupplierId)?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Period:</span>
                  <span>{startDate} to {endDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--green-200)', paddingTop: 8, marginTop: 8 }}>
                  <span style={{ fontWeight: 800 }}>Total Output:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green-700)' }}>{report.total_quantity} kg</span>
                </div>
              </div>

              <h4 style={{ marginBottom: 12, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Worker Breakdown</h4>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: 8 }}>Worker</th>
                      <th style={{ textAlign: 'right', padding: 8 }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.worker_breakdown.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 8 }}>{row.worker_name}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{row.total} kg</td>
                      </tr>
                    ))}
                    {report.worker_breakdown.length === 0 && (
                      <tr><td colSpan={2} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No data for this range</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary w-full" onClick={() => setReport(null)}>Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .filter-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .glass-card { background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); box-shadow: 0 4px 24px rgba(0,0,0,0.04) !important; }
        
        .status-bar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); border: 1px solid var(--border); }
        .auto-save-hint { display: flex; align-items: center; gap: 8px; color: var(--green-700); font-size: 13px; font-weight: 500; }
        .last-sync-tag { font-size: 12px; color: var(--text-muted); background: var(--bg-main); padding: 4px 10px; border-radius: 20px; }

        .premium-leaderboard-item { display: flex; align-items: center; gap: 16px; padding: 12px; margin-bottom: 12px; background: #fff; border-radius: 12px; border: 1px solid #f0f0f0; transition: all 0.2s; }
        .premium-leaderboard-item:hover { transform: translateX(5px); border-color: var(--green-200); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .leader-rank { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 14px; }
        .rank-1 { background: linear-gradient(135deg, #FFD700, #DAA520); }
        .rank-2 { background: linear-gradient(135deg, #C0C0C0, #808080); }
        .rank-3 { background: linear-gradient(135deg, #CD7F32, #A0522D); }
        .leader-info { flex: 1; display: flex; flex-direction: column; }
        .leader-name { font-weight: 700; color: var(--text-main); font-size: 15px; }
        .leader-avg { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .leader-value { text-align: right; }
        .leader-value span { display: block; font-size: 18px; font-weight: 800; color: var(--green-700); line-height: 1; }
        .leader-value small { font-size: 11px; font-weight: 700; color: var(--text-muted); }

        .summary-card { position: relative; overflow: hidden; }
        .summary-card::after { content: ''; position: absolute; top: -50%; right: -20%; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .summary-row .label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 1px; }
        .summary-row .val { font-size: 13px; font-weight: 700; }
        .total-badge { margin-top: auto; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; }
        .total-label { font-size: 10px; font-weight: 800; color: var(--green-400); margin-bottom: 8px; letter-spacing: 1px; }
        .total-val { display: flex; align-items: center; gap: 12px; }
        .total-val span { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }

        .productivity-table-container { overflow-x: auto; max-width: 100%; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); background: #fff; border: 1px solid var(--border); }
        .productivity-table { border-collapse: separate; border-spacing: 0; min-width: 1200px; }
        .productivity-table th { padding: 12px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
        .productivity-table td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); padding: 0; }
        .date-th { width: 44px; color: var(--text-muted); background: #fafafa; }
        
        /* Sticky Columns */
        .sticky-col-sno { 
          position: sticky; 
          left: 0; 
          background: #fff !important; 
          z-index: 30; 
          min-width: 50px; 
          text-align: center; 
          border-right: 1px solid var(--border) !important; 
          font-weight: 800; 
          color: var(--text-muted); 
          font-size: 12px;
        }
        .sticky-col-name { 
          position: sticky; 
          left: 50px; 
          background: #fff !important; 
          z-index: 30; 
          min-width: 200px; 
          text-align: left; 
          padding: 14px 20px !important; 
          border-right: 2px solid var(--border) !important; 
          font-weight: 700; 
          color: var(--green-900);
          box-shadow: 4px 0 8px rgba(0,0,0,0.02);
        }
        
        /* Background fix for even rows and highlights */
        .productivity-table tr:nth-child(even) .sticky-col-sno, 
        .productivity-table tr:nth-child(even) .sticky-col-name { 
          background: #f9faf9 !important; 
        }
        .row-highest .sticky-col-sno, .row-highest .sticky-col-name { 
          background: #f1f8f1 !important; 
        }
        .row-lowest .sticky-col-sno, .row-lowest .sticky-col-name { 
          background: #fdf6f6 !important; 
        }

        .productivity-table tr:hover .sticky-col-sno,
        .productivity-table tr:hover .sticky-col-name {
          background: #f5fcf5 !important;
        }

        .productivity-table thead th.sticky-col-sno, 
        .productivity-table thead th.sticky-col-name { 
          z-index: 50; 
          background: #fcfdfc !important;
        }
        
        .productivity-table thead th { position: sticky; top: 0; z-index: 20; background: #fcfdfc; }
        .productivity-table thead th.stats-header { z-index: 45; }
        
        .stats-header { background: #f1f5f1 !important; font-weight: 800; min-width: 100px; color: var(--green-900); }
        .input-cell { width: 44px; }
        .input-cell input { width: 100%; height: 44px; border: none; background: transparent; text-align: center; outline: none; font-size: 13px; font-weight: 500; color: var(--text-main); }
        .input-cell input:focus { background: #fff; box-shadow: inset 0 0 0 2px var(--green-500); z-index: 1; }
        .total-col { color: var(--green-700); background: #f1f5f1 !important; font-size: 14px !important; text-align: center !important; font-weight: 800; }
        .avg-col { background: #f1f5f1 !important; font-size: 13px !important; text-align: right !important; padding: 0 16px !important; }

        /* Footer Styling */
        .factory-total-row td { padding: 12px 10px; font-weight: 800; border-top: 2px solid var(--green-200); }
        .sticky-total-label { position: sticky; left: 0; background: var(--green-50); z-index: 30; text-align: right; padding-right: 20px !important; color: var(--green-900); border-right: 2px solid var(--green-200) !important; }
        .day-sum { background: #fcfdfc; color: var(--green-600); text-align: center; font-size: 12px; }
        .grand-qty { background: var(--green-900); color: white; text-align: center; font-size: 15px; }
        .grand-salary { background: var(--green-900); color: var(--green-400); text-align: right; padding: 0 16px !important; font-size: 15px; }
      `}} />
    </div>
  );
};

export default WorkerProductivity;
