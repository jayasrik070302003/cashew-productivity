import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAgriculture, MdDelete, MdClose, MdAttachMoney, MdSave } from 'react-icons/md';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

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

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date)  params.start_date  = filters.start_date;
      if (filters.end_date)    params.end_date    = filters.end_date;
      if (filters.supplier_id) params.supplier_id = filters.supplier_id;
      const res = await api.get('/raw', { params });
      setEntries(res.data.data);
    } catch { toast.error('Failed to load raw entries'); }
    finally { setLoading(false); }
  };

  const fetchSuppliers = async () => {
    const res = await api.get('/suppliers');
    setSuppliers(res.data.data);
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
        // Show each field-level Sequelize error
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
        <span style={{ fontWeight: 600, fontSize: '13px', alignSelf: 'center' }}>Filters:</span>
        <select className="form-control" value={filters.supplier_id} onChange={e => setFilters(p => ({ ...p, supplier_id: e.target.value }))}>
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" className="form-control" value={filters.start_date} onChange={e => setFilters(p => ({ ...p, start_date: e.target.value }))} />
        <input type="date" className="form-control" value={filters.end_date} onChange={e => setFilters(p => ({ ...p, end_date: e.target.value }))} />
        <button className="btn btn-primary" onClick={fetchEntries}>Apply</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ start_date: '', end_date: '', supplier_id: '' }); fetchEntries(); }}>Reset</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdAgriculture /> Raw Entries ({entries.length})</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Date</th><th>Supplier</th><th>Quantity (kg)</th><th>Cost/kg (₹)</th><th>Total Cost (₹)</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No entries found</td></tr>
                  ) : entries.map((e, i) => (
                    <tr key={e.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
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
                {entries.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--green-50)', fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: '10px 14px', color: 'var(--green-800)' }}>TOTAL</td>
                      <td style={{ padding: '10px 14px' }}>{totalQty.toLocaleString('en-IN')} kg</td>
                      <td></td>
                      <td style={{ padding: '10px 14px', color: 'var(--green-700)' }}>₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
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
                  <select className={`form-control ${errors.supplier_id ? 'error' : ''}`} value={form.supplier_id}
                    onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
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
                  <input type="date" className={`form-control ${errors.date ? 'error' : ''}`} value={form.date}
                    max={today}
                    onChange={e => setForm({ ...form, date: e.target.value })} />
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
