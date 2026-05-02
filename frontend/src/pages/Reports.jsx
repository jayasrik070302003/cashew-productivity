import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MdDescription, MdDownload, MdBarChart } from 'react-icons/md';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch { toast.error('Failed to load summary'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, []);

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Cashew Factory Production Report', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = [
      ['Total Raw Input', `${data.total_input} kg`],
      ['Total Processed Output', `${data.total_output} kg`],
      ['Net Processing Waste', `${data.waste} kg`],
      ['Average Efficiency', `${data.efficiency}%`],
      ['-----------------', '-----------------'],
      ['Total Sales Revenue', `Rs. ${data.total_revenue}`],
      ['Raw Material Cost', `Rs. ${data.total_raw_cost}`],
      ['Workforce Salary', `Rs. ${data.total_worker_salary}`],
      ['Other Expenses', `Rs. ${data.total_expenses}`],
      ['-----------------', '-----------------'],
      ['NET PROFIT/LOSS', `Rs. ${data.profit}`],
    ];

    doc.autoTable({
      startY: 40,
      head: [['KPI Name', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 31] }
    });

    doc.save('cashew_factory_report.pdf');
  };

  const exportExcel = () => {
    if (!data) return;
    const ws_data = [
        ["Factory Financial Summary"],
        ["Metric", "Value"],
        ["Total Raw Input (kg)", data.total_input],
        ["Total Output (kg)", data.total_output],
        ["Production Efficiency", `${data.efficiency}%`],
        ["Waste (kg)", data.waste],
        ["Total Revenue", data.total_revenue],
        ["Raw Cost", data.total_raw_cost],
        ["Salary Paid", data.total_worker_salary],
        ["Misc Expenses", data.total_expenses],
        ["Net Profit", data.profit]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Summary");
    XLSX.writeFile(wb, "cashew_factory_financials.xlsx");
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Factory Reports</h1>
          <p>Export financial and production summaries</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdDescription /> Financial Statement</h3>
          </div>
          <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {[
                      { l: 'Production Efficiency', v: `${data.efficiency}%`, c: 'var(--green-700)' },
                      { l: 'Total Input', v: `${data.total_input} kg`, c: 'var(--text-main)' },
                      { l: 'Total Output', v: `${data.total_output} kg`, c: 'var(--text-main)' },
                      { l: 'Total Revenue', v: `₹${data.total_revenue}`, c: 'var(--green-600)' },
                      { l: 'Total Cost (Raw+Worker+Misc)', v: `₹${data.total_raw_cost + data.total_worker_salary + data.total_expenses}`, c: 'var(--danger)' },
                  ].map(x => (
                      <div key={x.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                          <span style={{ fontWeight: 500 }}>{x.l}</span>
                          <span style={{ fontWeight: 800, color: x.c }}>{x.v}</span>
                      </div>
                  ))}
                  
                  <div style={{ background: data.profit >= 0 ? 'var(--green-50)' : '#ffebee', padding: '20px', borderRadius: '10px', marginTop: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>NET OPERATING PROFIT</div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: data.profit >= 0 ? 'var(--green-700)' : 'var(--danger)' }}>
                        ₹{data.profit.toLocaleString()}
                      </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button className="btn btn-outline w-full" style={{flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={exportPDF}><MdDownload /> Export PDF</button>
                      <button className="btn btn-primary w-full" style={{flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={exportExcel}><MdBarChart /> Export Excel</button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;
