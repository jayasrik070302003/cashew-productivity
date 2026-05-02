import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdListAlt, MdClose } from 'react-icons/md';
import api from '../utils/api';

const WorkerLogs = () => {
  const [logs, setLogs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ worker_id: '', batch_id: '', quantity_processed: '', working_days: '', log_date: new Date().toISOString().split('T')[0], notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, workersRes, batchesRes] = await Promise.all([
        api.get('/worker-logs'),
        api.get('/workers'),
        api.get('/batches')
      ]);
      setLogs(logsRes.data.data);
      setWorkers(workersRes.data.data);
      setBatches(batchesRes.data.data.filter(b => b.status === 'in_progress'));
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedWorker = workers.find(w => w.id === parseInt(form.worker_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/worker-logs', form);
      toast.success('Log added!');
      setShowModal(false);
      setForm({ worker_id: '', batch_id: '', quantity_processed: '', working_days: '', log_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding log');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Worker Activity Logs</h1>
          <p>Daily processing quantity and attendance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Log</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdListAlt /> Daily Logs</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Batch</th>
                    <th>Qty / Days</th>
                    <th>Salary (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td>{l.log_date}</td>
                      <td style={{ fontWeight: 600 }}>{l.worker?.name}</td>
                      <td>{l.batch?.batch_code || l.batch_id}</td>
                      <td>
                        {l.worker?.payment_type === 'per_kg' ? `${l.quantity_processed} kg` : `${l.working_days} days`}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>₹{l.salary}</td>
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
              <h3>Create Worker Log</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Worker *</label>
                  <select className="form-control" value={form.worker_id} onChange={e => setForm({...form, worker_id: e.target.value})} required>
                    <option value="">Select Worker</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch *</label>
                  <select className="form-control" value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})} required>
                    <option value="">Select Active Batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code || `Batch #${b.id}`}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Log Date *</label>
                    <input type="date" className="form-control" value={form.log_date} onChange={e => setForm({...form, log_date: e.target.value})} required />
                  </div>
                  {selectedWorker?.payment_type === 'per_kg' ? (
                     <div className="form-group">
                        <label>Quantity Processed (kg) *</label>
                        <input type="number" className="form-control" value={form.quantity_processed} onChange={e => setForm({...form, quantity_processed: e.target.value})} required />
                    </div>
                  ) : (
                    <div className="form-group">
                        <label>Working Days *</label>
                        <input type="number" step="0.5" className="form-control" value={form.working_days} onChange={e => setForm({...form, working_days: e.target.value})} required />
                    </div>
                  )}
                </div>
                {selectedWorker && (
                    <div className="alert alert-success">
                        Estimated Salary: ₹{
                            selectedWorker.payment_type === 'per_kg' 
                            ? (form.quantity_processed * selectedWorker.rate || 0)
                            : (form.working_days * selectedWorker.rate || 0)
                        }
                    </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Submit Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerLogs;
