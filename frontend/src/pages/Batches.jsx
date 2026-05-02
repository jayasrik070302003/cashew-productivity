import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdFactory, MdClose, MdLocalShipping } from 'react-icons/md';
import api from '../utils/api';

const Batches = () => {
  const [batches, setBatches]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  const [addForm, setAddForm] = useState({ batch_code: '', supplier_id: '', start_date: '', end_date: '', raw_quantity_used: '', notes: '' });
  const [updateForm, setUpdateForm] = useState({ end_date: '', output_quantity: '', notes: '' });
  
  const [errors, setErrors] = useState({});
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

  const handleAddSubmit = async (ev) => {
    ev.preventDefault();
    if (!addForm.start_date || !addForm.raw_quantity_used || !addForm.supplier_id) {
      toast.error('Please fill required fields (Supplier, Start Date, Quantity)');
      return;
    }
    setSubmitting(true);
    try {
      if (selectedBatch) {
        await api.put(`/batches/${selectedBatch.id}`, addForm);
        toast.success('Batch updated!');
      } else {
        await api.post('/batches', addForm);
        toast.success('Batch started!');
      }
      setAddForm({ batch_code: '', supplier_id: '', start_date: '', end_date: '', raw_quantity_used: '', notes: '' });
      setSelectedBatch(null);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch');
    } finally { setSubmitting(false); }
  };

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
          <p>Track production batches and processing efficiency</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Start New Batch</button>
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
                  {batches.map(b => (
                    <tr key={b.id}>
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
                          {b.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td>{b.raw_quantity_used}</td>
                      <td>{b.output_quantity || '—'}</td>
                      <td style={{ fontWeight: 600, color: b.efficiency < 60 ? 'var(--danger)' : 'var(--green-700)' }}>
                         {b.efficiency ? `${b.efficiency}%` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setSelectedBatch(b);
                            setAddForm({ 
                              batch_code: b.batch_code, 
                              supplier_id: b.supplier_id, 
                              start_date: b.start_date, 
                              end_date: b.end_date,
                              raw_quantity_used: b.raw_quantity_used, 
                              notes: b.notes 
                            });
                            setShowAddModal(true);
                          }}>Edit</button>
                          {b.status !== 'completed' && (
                            <button className="btn btn-success btn-sm" onClick={() => openUpdateModal(b)}>Complete</button>
                          )}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setSelectedBatch(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedBatch ? 'Edit Batch Details' : 'Start New Batch'}</h3>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setSelectedBatch(null); }}><MdClose /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Supplier *</label>
                  <select className="form-control" value={addForm.supplier_id} 
                    onChange={e => setAddForm({...addForm, supplier_id: e.target.value})} required>
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch Code (Optional)</label>
                  <input className="form-control" value={addForm.batch_code} 
                    onChange={e => setAddForm({...addForm, batch_code: e.target.value})} placeholder="e.g. B-2024-05" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" className="form-control" value={addForm.start_date}
                      onChange={e => setAddForm({...addForm, start_date: e.target.value})} required />
                  </div>
                  {selectedBatch && (
                    <div className="form-group">
                      <label>End Date (Optional)</label>
                      <input type="date" className="form-control" value={addForm.end_date || ''}
                        onChange={e => setAddForm({...addForm, end_date: e.target.value})} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Raw Quantity Used (kg) *</label>
                    <input type="number" step="0.01" className="form-control" value={addForm.raw_quantity_used}
                      onChange={e => setAddForm({...addForm, raw_quantity_used: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Notes</label>
                  <textarea className="form-control" value={addForm.notes}
                    onChange={e => setAddForm({...addForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Start Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        Efficiency: {((updateForm.output_quantity / selectedBatch.raw_quantity_used) * 100).toFixed(2)}%
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
