import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdMoneyOff, MdClose } from 'react-icons/md';
import api from '../utils/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'tea', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', form);
      toast.success('Expense recorded!');
      setShowModal(false);
      setForm({ type: 'tea', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording expense');
    } finally { setSubmitting(false); }
  };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Misc Expenses</h1>
          <p>Tea, electricity, transport and other factory costs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
         <div className="card" style={{ flex: 1, padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CUMULATIVE EXPENSE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>₹{total.toLocaleString()}</div>
         </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdMoneyOff /> Expense Log</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>
                        <span className={`badge badge-brown`} style={{textTransform: 'capitalize'}}>{e.type}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{e.amount}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{e.description || '—'}</td>
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
              <h3>Add Factory Expense</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Expense Type *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="tea">Tea / Snacks</option>
                        <option value="electricity">Electricity</option>
                        <option value="transport">Transport</option>
                        <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" className="form-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Maintenance, bill details etc." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
