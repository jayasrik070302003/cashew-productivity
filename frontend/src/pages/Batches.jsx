import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdFactory, MdClose, MdLocalShipping } from 'react-icons/md';
import api from '../utils/api';

const Batches = () => {
  const [batches, setBatches]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  const [updateForm, setUpdateForm] = useState({ end_date: '', output_quantity: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([api.get('/batches'), api.get('/suppliers')]);
      setBatches(bRes.data.data);
      setSuppliers(sRes.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateSubmit = async (ev) => {
    ev.preventDefault();
    if (!updateForm.end_date || !updateForm.output_quantity) {
      toast.error('End date and output quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/batches/${selectedBatch.id}`, updateForm);
      toast.success('Batch completed!');
      setShowUpdateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update batch');
    } finally { setSubmitting(false); }
  };

  const openUpdateModal = (batch) => {
    setSelectedBatch(batch);
    setUpdateForm({ 
      end_date: new Date().toISOString().split('T')[0], 
      output_quantity: '', 
      notes: batch.notes || '' 
    });
    setShowUpdateModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Batch Processing</h1>
          <p>Track production batches and processing efficiency (Auto-created from Raw Entry)</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdFactory /> Production Batches ({batches.length})</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Batch Code</th>
                    <th>Supplier</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Input (kg)</th>
                    <th>Output (kg)</th>
                    <th>Efficiency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b, idx) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{b.batch_code || `BATCH-${b.id}`}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MdLocalShipping size={14} color="var(--green-600)" />
                          {b.supplier?.name || '—'}
                        </span>
                      </td>
                      <td>{b.start_date}</td>
                      <td>
                        <span className={`badge ${b.status === 'completed' ? 'badge-green' : 'badge-orange'}`}>
                          {b.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </td>
                      <td>{b.input_quantity}</td>
                      <td>{b.output_quantity || '—'}</td>
                      <td style={{ fontWeight: 600, color: b.efficiency < 60 ? 'var(--danger)' : 'var(--green-700)' }}>
                         {b.efficiency ? `${b.efficiency}%` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status !== 'completed' && (
                            <button className="btn btn-success btn-sm" onClick={() => openUpdateModal(b)}>Complete Batch</button>
                          )}
                          {b.status === 'completed' && <span style={{ fontSize: '12px', color: 'var(--green-600)', fontWeight: 600 }}>✔ Finished</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Batch: {selectedBatch?.batch_code || selectedBatch?.id}</h3>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" className="form-control" value={updateForm.end_date}
                      onChange={e => setUpdateForm({...updateForm, end_date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Output Quantity (kg) *</label>
                    <input type="number" step="0.01" className="form-control" value={updateForm.output_quantity}
                      onChange={e => setUpdateForm({...updateForm, output_quantity: e.target.value})} required />
                  </div>
                </div>
                {updateForm.output_quantity && selectedBatch && (
                    <div className="alert alert-info">
                        Efficiency: {((updateForm.output_quantity / selectedBatch.input_quantity) * 100).toFixed(2)}%
                    </div>
                )}
                <div className="form-group">
                  <label>Final Notes</label>
                  <textarea className="form-control" value={updateForm.notes}
                    onChange={e => setUpdateForm({...updateForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={submitting}>Finish Processing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
