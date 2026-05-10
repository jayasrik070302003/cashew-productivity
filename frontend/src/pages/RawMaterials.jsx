import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAgriculture, MdDelete, MdClose, MdAttachMoney, MdSave } from 'react-icons/md';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomSelect from '../components/CustomSelect';

const RawMaterials = () => {
  const [entries, setEntries]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters]     = useState({ start_date: '', end_date: '', supplier_id: '' });
  const [form, setForm]           = useState({ supplier_id: '', quantity: '', cost_per_kg: '', date: '', notes: '' });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, loading: false });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date)  params.start_date  = filters.start_date;
      if (filters.end_date)    params.end_date    = filters.end_date;
      if (filters.supplier_id) params.supplier_id = filters.supplier_id;
      const res = await api.get('/raw', { params });
      setEntries(res.data.data);
      setCurrentPage(1); // Reset to page 1 on new search
    } catch { toast.error('Failed to load raw entries'); }
    finally { setLoading(false); }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch { toast.error('Failed to load suppliers'); }
  };

  useEffect(() => { fetchEntries(); fetchSuppliers(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e = {};
    if (!form.supplier_id)                            e.supplier_id  = 'Select a supplier';
    if (!form.quantity || parseFloat(form.quantity) <= 0)   e.quantity     = 'Quantity must be > 0';
    if (!form.cost_per_kg || parseFloat(form.cost_per_kg) <= 0) e.cost_per_kg = 'Cost must be > 0';
    if (!form.date)                                   e.date         = 'Date is required';
    else if (form.date > today)                       e.date         = 'Date cannot be in the future';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await api.post('/raw', form);
      toast.success('Raw entry added!');
      setForm({ supplier_id: '', quantity: '', cost_per_kg: '', date: '', notes: '' });
      setShowModal(false);
      fetchEntries();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach(fe => toast.error(`${fe.field}: ${fe.message}`));
      } else {
        toast.error(data?.message || 'Submission failed');
      }
    } finally { setSubmitting(false); }
  };

  const handleDeleteRequest = (id) => {
    setConfirmDelete({ isOpen: true, id, loading: false });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    setConfirmDelete(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/raw/${confirmDelete.id}`);
      toast.success('Raw entry deleted');
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, loading: false });
    }
  };

  const totalCost = entries.reduce((s, e) => s + parseFloat(e.total_cost || 0), 0);
  const totalQty  = entries.reduce((s, e) => s + parseFloat(e.quantity || 0), 0);

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <div><h1>Raw Materials</h1><p>Track all raw cashew purchases from suppliers</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Entry</button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Quantity', value: `${totalQty.toLocaleString('en-IN')} kg`, color: 'var(--green-700)' },
          { label: 'Total Cost', value: `₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'var(--brown-700)' },
          { label: 'Avg Cost/kg', value: `₹${totalQty ? (totalCost/totalQty).toFixed(2) : 0}`, color: 'var(--info)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: c.color, marginTop: '4px' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-label">Filters:</span>
        <div style={{ width: '200px' }}>
          <CustomSelect 
            options={[{ id: '', name: 'All Suppliers' }, ...suppliers]}
            value={filters.supplier_id}
            onChange={(val) => setFilters(p => ({ ...p, supplier_id: val }))}
            placeholder="All Suppliers"
          />
        </div>
        <div className="date-input-wrapper">
          <input type="date" className="premium-date-input" value={filters.start_date} onChange={e => setFilters(p => ({ ...p, start_date: e.target.value }))} />
        </div>
        <div className="date-input-wrapper">
          <input type="date" className="premium-date-input" value={filters.end_date} onChange={e => setFilters(p => ({ ...p, end_date: e.target.value }))} />
        </div>
        <button className="btn btn-success" onClick={fetchEntries} style={{ height: '42px', padding: '0 24px' }}>Apply Filters</button>
        <button className="btn btn-outline" onClick={() => { setFilters({ start_date: '', end_date: '', supplier_id: '' }); fetchEntries(); }} style={{ height: '42px' }}>Reset</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdAgriculture /> Raw Entries ({entries.length})</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
                <img src="/empty_batches.png" alt="No raw entries found" style={{ maxWidth: '400px', width: '100%', opacity: 0.9, marginTop: '-20px' }} />
                <h3 style={{ color: '#64748b', fontWeight: 600, marginTop: '10px' }}>No Raw Materials Found</h3>
                <p style={{ color: '#94a3b8' }}>Log your raw material purchases to start tracking your inventory.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Date</th><th>Supplier</th><th>Quantity (kg)</th><th>Cost/kg (₹)</th><th>Total Cost (₹)</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((e, i) => (
                      <tr key={e.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{startIndex + i + 1}</td>
                        <td>{e.date}</td>
                        <td style={{ fontWeight: 600 }}>{e.supplier?.name || '—'}</td>
                        <td>{parseFloat(e.quantity).toLocaleString('en-IN')}</td>
                        <td>₹{parseFloat(e.cost_per_kg).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>₹{parseFloat(e.total_cost).toLocaleString('en-IN')}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRequest(e.id)}><MdDelete /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--green-50)', fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: '10px 14px', color: 'var(--green-800)' }}>TOTAL (ALL)</td>
                      <td style={{ padding: '10px 14px' }}>{totalQty.toLocaleString('en-IN')} kg</td>
                      <td></td>
                      <td style={{ padding: '10px 14px', color: 'var(--green-700)' }}>₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
        {!loading && entries.length > 0 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, entries.length)} of {entries.length} entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button className="btn btn-outline btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Raw Material Entry</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Supplier *</label>
                  <CustomSelect 
                    options={suppliers}
                    value={form.supplier_id}
                    onChange={(val) => setForm({ ...form, supplier_id: val })}
                    placeholder="Select Supplier"
                    className={errors.supplier_id ? 'error' : ''}
                  />
                  {errors.supplier_id && <div className="error-msg">{errors.supplier_id}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity (kg) *</label>
                    <input type="number" step="0.1" className={`form-control ${errors.quantity ? 'error' : ''}`} value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="500" />
                    {errors.quantity && <div className="error-msg">{errors.quantity}</div>}
                  </div>
                  <div className="form-group">
                    <label>Cost per kg (₹) *</label>
                    <input type="number" step="0.01" className={`form-control ${errors.cost_per_kg ? 'error' : ''}`} value={form.cost_per_kg}
                      onChange={e => setForm({ ...form, cost_per_kg: e.target.value })} placeholder="85" />
                    {errors.cost_per_kg && <div className="error-msg">{errors.cost_per_kg}</div>}
                  </div>
                </div>
                {form.quantity && form.cost_per_kg && (
                  <div className="alert alert-success" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdAttachMoney /> Total Cost: <strong>₹{(form.quantity * form.cost_per_kg).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
                <div className="form-group" style={{ marginTop: form.quantity && form.cost_per_kg ? '14px' : '0' }}>
                  <label>Date *</label>
                  <input type="date" className={`premium-date-input ${errors.date ? 'error' : ''}`} style={{ width: '100%' }} value={form.date}
                    max={today} onChange={e => setForm({...form, date: e.target.value})} required />
                  {errors.date && <div className="error-msg">{errors.date}</div>}
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdSave /> Add Entry</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Raw Entry"
        message="Are you sure you want to delete this raw material entry?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, loading: false })}
        loading={confirmDelete.loading}
      />
    </div>
  );
};

export default RawMaterials;
