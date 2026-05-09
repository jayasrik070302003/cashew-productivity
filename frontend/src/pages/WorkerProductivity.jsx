import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  MdSave, MdFileDownload, MdEvent, MdEmojiEvents, MdCloudDone, MdLocalShipping, MdHistory, MdFilterList, MdAgriculture, MdLayers, MdLock
} from 'react-icons/md';
import api from '../utils/api';

const LS_KEY = 'workerProductivityGrid_v2';

// ── Helpers ───────────────────────────────────────────────────────────────────

const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const lsSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('localStorage write failed:', e); }
};

const cellKey = (workerId, batchId, date) => `${workerId}||${batchId}||${date}`;
const parseKey = (key) => {
  const [workerId, batchId, date] = key.split('||');
  return { workerId, batchId, date };
};

// ── Component ─────────────────────────────────────────────────────────────────

const WorkerProductivity = () => {
  const [workers, setWorkers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [gridData, setGridData] = useState(() => lsGet(LS_KEY) || {});
  const [isDirty, setIsDirty]   = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [report, setReport] = useState(null);
  const [fetchingReport, setFetchingReport] = useState(false);

  const activeBatch = useMemo(() => batches.find(b => b.id == selectedBatchId), [selectedBatchId, batches]);
  const isClosed = activeBatch?.status === 'completed';

  // Fetch lists
  useEffect(() => {
    const init = async () => {
      try {
        const [wRes, bRes] = await Promise.all([api.get('/workers'), api.get('/batches')]);
        setWorkers(wRes.data.data);
        setBatches(bRes.data.data);
      } catch { toast.error('Failed to load initial data'); }
      setLoading(false);
    };
    init();
  }, []);

  // When a batch is selected, auto-set dates and fetch logs
  useEffect(() => {
    if (!selectedBatchId) return;
    if (activeBatch) {
      setStartDate(activeBatch.start_date);
      setEndDate(activeBatch.end_date || '');

      // Fetch all logs for this batch
      const fetchLogs = async () => {
        try {
          const res = await api.get(`/worker-daily?batch_id=${selectedBatchId}`);
          setGridData(prev => {
            const merged = { ...prev };
            res.data.data.forEach(log => {
              merged[cellKey(log.worker_id, log.batch_id, log.date)] = String(log.quantity_processed || '');
            });
            return merged;
          });
        } catch { toast.error('Failed to load batch logs'); }
      };
      fetchLogs();
    }
  }, [selectedBatchId, activeBatch]);

  useEffect(() => { lsSet(LS_KEY, gridData); }, [gridData]);

  const activeDates = useMemo(() => {
    if (!startDate) return [];
    
    let maxDateStr = startDate;
    Object.keys(gridData).forEach(key => {
      const { batchId: bId, date } = parseKey(key);
      if (bId === String(selectedBatchId) && gridData[key] !== '') {
        if (date > maxDateStr) maxDateStr = date;
      }
    });

    const dates = [];
    const parseISODate = (str) => {
      const [y, m, d] = str.split('-');
      return new Date(y, m - 1, d);
    };
    const formatISODate = (dateObj) => {
      return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    };

    let curr = parseISODate(startDate);
    const end = parseISODate(maxDateStr);
    
    if (!isClosed) {
      end.setDate(end.getDate() + 1);
    }

    while (curr <= end) {
      dates.push(formatISODate(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [startDate, gridData, selectedBatchId, isClosed]);

  const fetchReport = async () => {
    if (!selectedBatchId) { toast.warn('Select a batch first'); return; }
    setFetchingReport(true);
    try {
      const res = await api.get(`/worker-daily/report?batch_id=${selectedBatchId}&from_date=${startDate}&to_date=${endDate}`);
      setReport(res.data);
    } catch { toast.error('Failed to fetch report'); }
    finally { setFetchingReport(false); }
  };

  const handleInputChange = (workerId, date, value) => {
    if (isClosed) return; // Prevent edits if closed
    if (!selectedBatchId) { toast.warn('Select a batch first'); return; }
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) return;

    const k = cellKey(workerId, selectedBatchId, date);

    setGridData(prev => ({ ...prev, [k]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isDirty || !selectedBatchId || isClosed) return;
    
    const toSave = Object.entries(gridData).filter(([k]) => {
      const { batchId } = parseKey(k);
      return batchId === String(selectedBatchId);
    });

    if (toSave.length === 0) { setIsDirty(false); return; }

    try {
      await Promise.all(
        toSave.map(([k, val]) => {
          const { workerId, batchId, date } = parseKey(k);
          const qty = parseFloat(val) || 0;
          return api.post('/worker-daily', { worker_id: workerId, batch_id: batchId, date, quantity_processed: qty });
        })
      );
      toast.success('Batch productivity saved!');
      setIsDirty(false);
      setLastSaved(new Date());
    } catch { toast.error('Failed to sync to database'); }
  };

  const stats = useMemo(() => {
    const workerStats = workers.map(w => {
      let total = 0;
      activeDates.forEach(date => {
        const val = gridData[cellKey(w.id, selectedBatchId, date)];
        if (val && !isNaN(val)) total += parseFloat(val);
      });
      return { id: w.id, name: w.name, total, salary: total * 26 };
    });

    const sorted = [...workerStats].sort((a, b) => b.total - a.total);
    return {
      byId: workerStats.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
      topWorkers: sorted.filter(w => w.total > 0).slice(0, 3),
      highest: sorted[0]?.total > 0 ? sorted[0].id : null,
      lowest: sorted.length > 1 && sorted[sorted.length - 1]?.total > 0 ? sorted[sorted.length - 1].id : null,
      totalQty: workerStats.reduce((s, w) => s + w.total, 0)
    };
  }, [workers, gridData, activeDates, selectedBatchId]);

  return (
    <div className="productivity-page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>Batch Productivity Tracking</h1>
          <p>Detailed lot-wise worker management and salary calculation.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isClosed ? (
            <div className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
              <MdLock /> READ-ONLY: BATCH CLOSED
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleSave} disabled={!isDirty || !selectedBatchId}>
              <MdSave /> {isDirty ? 'Sync Batch Changes' : 'Batch Data Synced'}
            </button>
          )}
        </div>
      </div>

      {/* Selectors */}
      <div className="card shadow-sm" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr', gap: '20px', alignItems: 'flex-end' }}>
            <div className="filter-group">
              <label className="filter-label"><MdLayers /> Select Batch / Lot</label>
              <div className="custom-select-container">
                <div 
                  className={`custom-select-trigger ${isDropdownOpen ? 'open' : ''}`} 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="trigger-text">
                    {selectedBatchId 
                      ? (() => {
                          const b = batches.find(b => b.id == selectedBatchId);
                          if (!b) return '-- Select Batch --';
                          return (
                            <>
                              <span className={`status-dot ${b.status === 'completed' ? 'closed' : 'active'}`}></span>
                              <strong>{b.supplier?.name}</strong> - {b.batch_code || `Lot #${b.id}`}
                            </>
                          );
                        })()
                      : '-- Select Batch (Active/Closed) --'
                    }
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <>
                    <div className="dropdown-backdrop" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="custom-select-options">
                      <div 
                        className={`custom-select-option ${selectedBatchId === '' ? 'selected' : ''}`}
                        onClick={() => { setSelectedBatchId(''); setIsDropdownOpen(false); }}
                      >
                        -- Clear Selection --
                      </div>
                      {batches.map(b => (
                        <div 
                          key={b.id}
                          className={`custom-select-option ${selectedBatchId == b.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedBatchId(b.id); setIsDropdownOpen(false); }}
                        >
                          <span className={`status-dot ${b.status === 'completed' ? 'closed' : 'active'}`}></span>
                          <strong>{b.supplier?.name}</strong> <span className="batch-code">- {b.batch_code || `Lot #${b.id}`}</span>
                          <span className="date-hint">{b.start_date}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label"><MdEvent /> Batch Timeline</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" className="form-control" value={startDate} disabled style={{ height: 42, background: '#f5f5f5' }} />
                <span>to</span>
                <input type="date" className="form-control" value={endDate} disabled style={{ height: 42, background: '#f5f5f5' }} />
              </div>
            </div>
            <div className="filter-group">
               <button className="btn btn-secondary w-full" style={{ height: 42 }} onClick={fetchReport} disabled={!selectedBatchId}>
                <MdHistory /> View Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="insight-grid" style={{ marginBottom: 24 }}>
        <div className="card glass-card">
          <div className="card-header"><h3 style={{ fontSize: 15 }}><MdEmojiEvents color="#FFD700" /> Top Performers (This Batch)</h3></div>
          <div className="card-body">
            {stats.topWorkers.length === 0 ? <div className="text-center p-4">No production recorded yet</div> : 
              stats.topWorkers.map((w, idx) => (
                <div key={w.id} className="premium-leaderboard-item">
                  <div className={`leader-rank rank-${idx + 1}`}>{idx + 1}</div>
                  <div className="leader-info">
                    <span className="leader-name">{w.name}</span>
                    <span className="leader-avg">Earned: ₹{w.salary.toLocaleString()}</span>
                  </div>
                  <div className="leader-value"><span>{w.total.toFixed(1)}</span><small>kg</small></div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card summary-card" style={{ background: isClosed ? '#444' : 'var(--green-900)', color: 'white' }}>
          <div className="card-body">
            <div className="summary-row"><span className="label">BATCH</span><span className="val">{activeBatch?.batch_code || 'N/A'} {isClosed && '(Closed)'}</span></div>
            <div className="summary-row"><span className="label">SUPPLIER</span><span className="val">{activeBatch?.supplier?.name || 'N/A'}</span></div>
            <div className="summary-row"><span className="label">PERIOD</span><span className="val">{startDate} - {endDate || 'Ongoing'}</span></div>
            <div className="total-badge">
              <div className="total-label">FINAL BATCH OUTPUT</div>
              <div className="total-val"><MdAgriculture size={28} /><span>{stats.totalQty.toFixed(1)} kg</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {!selectedBatchId ? (
        <div className="empty-state-container">
           <div className="empty-icon-wrapper">
             <MdLayers size={42} />
           </div>
           <h3>No Batch Selected</h3>
           <p>Please select a production batch from the dropdown above to view its timeline, track worker productivity, and manage daily data.</p>
        </div>
      ) : (
        <div className={`productivity-table-container ${isClosed ? 'read-only-grid' : ''}`}>
          <table className="productivity-table">
            <thead>
              <tr>
                <th className="sticky-col-sno">S.NO</th>
                <th className="sticky-col-name">WORKER NAME</th>
                {activeDates.map((date) => {
                  const dObj = new Date(date.split('-')[0], date.split('-')[1] - 1, date.split('-')[2]);
                  const displayDate = dObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  return <th key={date} className="date-th">{displayDate}</th>;
                })}
                <th className="stats-header">TOTAL (KG)</th>
                <th className="stats-header">SALARY (₹)</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, idx) => (
                <tr key={w.id} className={w.id === stats.highest ? 'row-highest' : w.id === stats.lowest ? 'row-lowest' : ''}>
                  <td className="sticky-col-sno">{idx + 1}</td>
                  <td className="sticky-col-name">{w.name}</td>
                  {activeDates.map((date) => {
                    const val = gridData[cellKey(w.id, selectedBatchId, date)] ?? '';
                    return (
                      <td key={date} className="input-cell">
                        <input type="text" value={val} disabled={isClosed} placeholder={isClosed ? "—" : "0"}
                          onChange={e => handleInputChange(w.id, date, e.target.value)} />
                      </td>
                    );
                  })}
                  <td className="total-col">{stats.byId[w.id]?.total.toFixed(1) || '0.0'}</td>
                  <td className="avg-col" style={{ fontWeight: 800 }}>₹{(stats.byId[w.id]?.salary || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="factory-total-row">
                <td colSpan={2} className="sticky-total-label">BATCH TOTAL</td>
                {activeDates.map(date => {
                  let dayTotal = 0;
                  workers.forEach(w => {
                     const val = gridData[cellKey(w.id, selectedBatchId, date)];
                     if (val && !isNaN(val)) dayTotal += parseFloat(val);
                  });
                  return <td key={date} className="day-sum">{dayTotal > 0 ? dayTotal.toFixed(1) : '—'}</td>;
                })}
                <td className="grand-qty">{stats.totalQty.toFixed(1)}</td>
                <td className="grand-salary">₹{workers.reduce((sum, w) => sum + (stats.byId[w.id]?.salary || 0), 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Report Modal */}
      {report && (
        <div className="modal-overlay" onClick={() => setReport(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Batch Report: {activeBatch?.batch_code}</h3>
              <button className="modal-close" onClick={() => setReport(null)}>&times;</button>
            </div>
            <div className="modal-body">
               <div style={{ padding: 16, background: '#f0f7f0', borderRadius: 8, marginBottom: 16 }}>
                  <p><strong>Supplier:</strong> {activeBatch?.supplier?.name}</p>
                  <p><strong>Total Quantity:</strong> {report.total_quantity} kg</p>
                  <p><strong>Status:</strong> {activeBatch?.status === 'completed' ? 'Closed' : 'Active'}</p>
               </div>
               <table className="w-full">
                  <thead><tr style={{ borderBottom: '2px solid #eee' }}><th className="text-left p-2">Worker</th><th className="text-right p-2">Total</th></tr></thead>
                  <tbody>
                    {report.worker_breakdown.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}><td className="p-2">{r.worker_name}</td><td className="text-right p-2 font-bold">{r.total} kg</td></tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .read-only-grid input { background: #fdfdfd; color: #666; cursor: not-allowed; }
        .read-only-grid .input-cell input:focus { box-shadow: none !important; background: transparent; }

        .filter-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .glass-card { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.04) !important; }
        .premium-leaderboard-item { display: flex; align-items: center; gap: 16px; padding: 10px; margin-bottom: 8px; background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; }
        .leader-rank { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 12px; }
        .rank-1 { background: #FFD700; } .rank-2 { background: #C0C0C0; } .rank-3 { background: #CD7F32; }
        .leader-info { flex: 1; display: flex; flex-direction: column; }
        .leader-name { font-weight: 700; color: var(--text-main); font-size: 14px; }
        .leader-avg { font-size: 10px; color: var(--text-muted); }
        .leader-value { text-align: right; }
        .leader-value span { display: block; font-size: 16px; font-weight: 800; color: var(--green-700); }
        .summary-card { position: relative; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
        .summary-row .label { font-size: 10px; color: rgba(255,255,255,0.6); }
        .summary-row .val { font-weight: 700; }
        .total-badge { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-top: 10px; }
        .total-label { font-size: 10px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
        .total-val { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 900; }

        .productivity-table-container { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); background: #fff; }
        .productivity-table { border-collapse: separate; border-spacing: 0; min-width: 1200px; }
        .productivity-table th { padding: 12px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--border); }
        .date-th { width: 42px; background: #fafafa; text-align: center; }
        
        .sticky-col-sno { 
          position: sticky; 
          left: 0; 
          background-color: white !important; 
          z-index: 30; 
          min-width: 50px; 
          text-align: center; 
          border-right: 1px solid #eee !important;
        }
        .sticky-col-name { 
          position: sticky; 
          left: 50px; 
          background-color: white !important; 
          z-index: 30; 
          min-width: 200px; 
          padding: 10px 15px !important; 
          border-right: 2px solid var(--green-200) !important; 
          box-shadow: 4px 0 8px rgba(0,0,0,0.05);
        }
        
        .productivity-table thead th.sticky-col-sno, 
        .productivity-table thead th.sticky-col-name { 
          z-index: 40; 
          background-color: #fcfdfc !important;
        }

        .row-highest .sticky-col-sno, .row-highest .sticky-col-name { background-color: #f1f8f1 !important; }
        .row-lowest .sticky-col-sno, .row-lowest .sticky-col-name { background-color: #fdf6f6 !important; }
        .productivity-table tr:nth-child(even) .sticky-col-sno,
        .productivity-table tr:nth-child(even) .sticky-col-name { background-color: #fafafa !important; }

        .input-cell { width: 42px; padding: 0 !important; }
        .input-cell input { width: 100%; height: 40px; border: none; text-align: center; outline: none; font-size: 13px; }
        .input-cell input:focus { background: var(--green-50); box-shadow: inset 0 0 0 2px var(--green-500); }
        
        .total-col { background: #f8faf8 !important; text-align: center; font-weight: 800; color: var(--green-700); }
        .avg-col { background: #f8faf8 !important; text-align: right; padding: 0 10px !important; }
        
        .factory-total-row td { background: var(--green-50); font-weight: 800; padding: 10px; border-top: 2px solid var(--green-200); }
        .sticky-total-label { position: sticky; left: 0; z-index: 35; text-align: right; padding-right: 15px !important; border-right: 2px solid var(--green-200) !important; background: var(--green-50) !important; }
        
        .grand-qty { background: var(--green-900) !important; color: #fff; text-align: center; }
        .grand-salary { background: var(--green-900) !important; color: var(--green-400); text-align: right; padding: 0 10px !important; }

        /* Custom Dropdown CSS */
        .custom-select-container { position: relative; width: 100%; font-family: 'Inter', sans-serif; }
        .custom-select-trigger {
          display: flex; justify-content: space-between; align-items: center;
          height: 42px; padding: 0 16px; background: #fff; border: 1px solid #d1d5db;
          border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
          color: #374151; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .custom-select-trigger:hover, .custom-select-trigger.open { 
          border-color: var(--green-400); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); 
        }
        .custom-select-trigger .trigger-text { display: flex; align-items: center; gap: 8px; }
        .dropdown-arrow { font-size: 10px; color: #9ca3af; transition: transform 0.2s; }
        .custom-select-trigger.open .dropdown-arrow { transform: rotate(180deg); }
        
        .dropdown-backdrop { position: fixed; inset: 0; z-index: 99; }
        .custom-select-options {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          z-index: 100; max-height: 320px; overflow-y: auto; padding: 6px;
          animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .custom-select-option {
          padding: 10px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #4b5563; transition: all 0.15s;
        }
        .custom-select-option:hover { background: #f9fafb; color: #111827; }
        .custom-select-option.selected { background: #ecfdf5; color: #065f46; font-weight: 600; }
        .custom-select-option .batch-code { color: #6b7280; font-weight: 400; }
        
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .status-dot.active { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); }
        .status-dot.closed { background: #9ca3af; }
        
        .date-hint { margin-left: auto; color: #9ca3af; font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; }

        /* Premium Empty State */
        .empty-state-container {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px dashed #cbd5e1; border-radius: 16px;
          text-align: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        }
        .empty-icon-wrapper {
          width: 80px; height: 80px; background: #fff; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--green-500); box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.2);
          margin-bottom: 24px; animation: floatIcon 3s ease-in-out infinite;
        }
        .empty-state-container h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .empty-state-container p { font-size: 14px; color: #64748b; max-width: 400px; line-height: 1.5; margin: 0; }
        @keyframes floatIcon { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
      `}} />
    </div>
  );
};

export default WorkerProductivity;
