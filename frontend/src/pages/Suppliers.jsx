import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdLocalShipping, MdDelete, MdClose, MdSave } from 'react-icons/md';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({ name: '', contact: '', address: '' });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '', loading: false });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { search } });
      setSuppliers(res.data.data);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await api.post('/suppliers', form);
      toast.success('Supplier added!');
      setForm({ name: '', contact: '', address: '' });
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add supplier');
    } finally { setSubmitting(false); }
  };

  const handleDeleteRequest = (id, name) => {
    setConfirmDelete({ isOpen: true, id, name, loading: false });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    setConfirmDelete(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/suppliers/${confirmDelete.id}`);
      toast.success('Supplier deleted');
      fetch();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, name: '', loading: false });
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage cashew raw material suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Supplier</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdLocalShipping /> All Suppliers ({suppliers.length})</h3>
          <input className="form-control" style={{ width: '220px' }} placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Contact</th><th>Address</th><th>Added</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No suppliers found</td></tr>
                  ) : filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contact || '—'}</td>
                      <td>{s.address || '—'}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDeleteRequest(s.id, s.name)}><MdDelete /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Supplier</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rajan Farms" />
                  {errors.name && <div className="error-msg">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input className="form-control" value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea className="form-control" rows={3} value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdSave /> Add Supplier</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier?"
        highlight={confirmDelete.name}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '', loading: false })}
        loading={confirmDelete.loading}
      />
    </div>
  );
};

export default Suppliers;
