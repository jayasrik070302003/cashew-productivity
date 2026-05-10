import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAttachMoney, MdClose } from 'react-icons/md';
import api from '../utils/api';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ quantity_sold: '', price_per_kg: '', date: new Date().toISOString().split('T')[0], buyer_name: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(res.data.data);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/sales', form);
      toast.success('Sale recorded!');
      setShowModal(false);
      setForm({ quantity_sold: '', price_per_kg: '', date: new Date().toISOString().split('T')[0], buyer_name: '', notes: '' });
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording sale');
    } finally { setSubmitting(false); }
  };

  const totalRevenue = sales.reduce((s, x) => s + parseFloat(x.total_revenue), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales & Revenue</h1>
          <p>Final product sales and buyer tracking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Sale</button>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '16px', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
         <div style={{ fontSize: '13px', color: 'var(--green-800)', fontWeight: 700 }}>TOTAL REVENUE</div>
         <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green-700)' }}>₹{totalRevenue.toLocaleString()}</div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdAttachMoney /> Sales History</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
                <img src="/empty_batches.png" alt="No sales found" style={{ maxWidth: '400px', width: '100%', opacity: 0.9, marginTop: '-20px' }} />
                <h3 style={{ color: '#64748b', fontWeight: 600, marginTop: '10px' }}>No Sales Recorded</h3>
                <p style={{ color: '#94a3b8' }}>Log your first sale to start tracking revenue.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Buyer</th>
                      <th>Qty (kg)</th>
                      <th>Price/kg (₹)</th>
                      <th>Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id}>
                        <td>{s.date}</td>
                        <td style={{ fontWeight: 600 }}>{s.buyer_name || 'Generic Buyer'}</td>
                        <td>{s.quantity_sold} kg</td>
                        <td>₹{s.price_per_kg}</td>
                        <td style={{ fontWeight: 800, color: 'var(--green-700)' }}>₹{s.total_revenue}</td>
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
              <h3>Record New Sale</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Buyer Name</label>
                  <input className="form-control" value={form.buyer_name} onChange={e => setForm({...form, buyer_name: e.target.value})} placeholder="Company or Entity name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity Sold (kg) *</label>
                    <input type="number" className="form-control" value={form.quantity_sold} onChange={e => setForm({...form, quantity_sold: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Price per kg (₹) *</label>
                    <input type="number" className="form-control" value={form.price_per_kg} onChange={e => setForm({...form, price_per_kg: e.target.value})} required />
                  </div>
                </div>
                {form.quantity_sold && form.price_per_kg && (
                    <div className="alert alert-success">
                        Sale Value: ₹{(form.quantity_sold * form.price_per_kg).toLocaleString()}
                    </div>
                )}
                <div className="form-group">
                  <label>Sale Date *</label>
                  <input type="date" className="premium-date-input" style={{ width: '100%' }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
