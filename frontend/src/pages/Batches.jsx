import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdFactory, MdClose, MdLocalShipping, MdBarChart } from 'react-icons/md';
import api from '../utils/api';

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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



  const totalPages = Math.ceil(batches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBatches = batches.slice(startIndex, startIndex + itemsPerPage);

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
            batches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
                <img src="/empty_batches.png" alt="No batches found" style={{ maxWidth: '450px', width: '100%', opacity: 0.9, marginTop: '-20px' }} />
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Batch Code</th>
                      <th>Supplier</th>
                      <th>Start Date</th>
                      <th>Input (kg)</th>
                      <th>Output (kg)</th>
                      <th>Efficiency</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBatches.map((b, idx) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{startIndex + idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{b.batch_code || `BATCH-${b.id}`}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MdLocalShipping size={14} color="var(--green-600)" />
                            {b.supplier?.name || '—'}
                          </span>
                        </td>
                        <td>{b.start_date}</td>
                        <td>{b.input_quantity}</td>
                        <td>{b.output_quantity || '—'}</td>
                        <td style={{ fontWeight: 600, color: b.efficiency < 60 ? 'var(--danger)' : 'var(--green-700)' }}>
                           {b.efficiency ? `${b.efficiency}%` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'completed' ? 'badge-green' : 'badge-orange'}`}>
                            {b.status === 'completed' ? 'Finished' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => navigate(`/productivity?batch_id=${b.id}`)}
                          >
                            <MdBarChart /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
        {!loading && batches.length > 0 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, batches.length)} of {batches.length} batches
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page} 
                  className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default Batches;
