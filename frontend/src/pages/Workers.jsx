import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdEngineering, MdClose } from 'react-icons/md';
import api from '../utils/api';
import CustomSelect from '../components/CustomSelect';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'breaking', payment_type: 'daily', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers');
      setWorkers(res.data.data);
    } catch { toast.error('Failed to load workers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/workers', form);
      toast.success('Worker added!');
      setShowModal(false);
      setForm({ name: '', role: 'breaking', payment_type: 'daily', phone: '' });
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding worker');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Workers</h1>
          <p>Manage processing factory workforce</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Worker</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdEngineering /> Employee List</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            workers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
                <img src="/empty_batches.png" alt="No workers found" style={{ maxWidth: '400px', width: '100%', opacity: 0.9, marginTop: '-20px' }} />
                <h3 style={{ color: '#64748b', fontWeight: 600, marginTop: '10px' }}>No Workers Found</h3>
                <p style={{ color: '#94a3b8' }}>Add your employees to start tracking their daily productivity.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Payment Type</th>
                      <th>Contact</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 600 }}>{w.name}</td>
                        <td>
                          <span className="badge badge-blue" style={{textTransform: 'capitalize'}}>{w.role}</span>
                        </td>
                        <td>{w.payment_type === 'daily' ? 'Daily Wage' : 'Per Kg'}</td>
                        <td>{w.phone || '—'}</td>
                        <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Worker</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Worker Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-row">
                    <div className="form-group">
                    <label>Role *</label>
                    <CustomSelect 
                      options={[
                        { id: 'breaking', name: 'Breaking' },
                        { id: 'drying', name: 'Drying' },
                        { id: 'sorting', name: 'Sorting' }
                      ]}
                      value={form.role}
                      onChange={(val) => setForm({ ...form, role: val })}
                    />
                    </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Type *</label>
                    <CustomSelect 
                      options={[
                        { id: 'daily', name: 'Daily Wage' },
                        { id: 'per_kg', name: 'Per Kg' }
                      ]}
                      value={form.payment_type}
                      onChange={(val) => setForm({ ...form, payment_type: val })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Save Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
