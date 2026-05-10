import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  MdDescription, MdDownload, MdBarChart, MdDateRange, 
  MdTrendingUp, MdTrendingDown, MdPieChart, MdEmojiEvents, 
  MdAgriculture, MdLocalShipping, MdEngineering, MdFactory 
} from 'react-icons/md';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);
  
  // States for Monthly
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [monthlyData, setMonthlyData] = useState(null);

  // States for Yearly
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [yearlyData, setYearlyData] = useState([]);

  // States for Analytics
  const [analytics, setAnalytics] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'monthly') {
        const start = `${selectedMonth}-01`;
        const lastDay = new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate();
        const end = `${selectedMonth}-${lastDay}`;
        const res = await api.get('/dashboard', { params: { start_date: start, end_date: end } });
        setMonthlyData(res.data.data);
      } else if (activeTab === 'yearly') {
        const res = await api.get('/dashboard/monthly-trend', { params: { year: selectedYear } });
        setYearlyData(res.data.data);
      } else if (activeTab === 'analytics') {
        const res = await api.get('/dashboard');
        setAnalytics(res.data.data);
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedMonth, selectedYear]);

  const exportMonthlyPDF = () => {
    if (!monthlyData) return;
    const doc = new jsPDF();
    const [y, m] = selectedMonth.split('-');
    const monthName = new Date(y, m-1).toLocaleString('default', { month: 'long' });

    doc.setFontSize(22);
    doc.setTextColor(31, 78, 31);
    doc.text('Cashew Factory Monthly Report', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Period: ${monthName} ${y}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    const tableData = [
      ['Total Raw Input', `${monthlyData.total_input} kg`],
      ['Total Output', `${monthlyData.total_output} kg`],
      ['Efficiency', `${monthlyData.efficiency}%`],
      ['Waste', `${monthlyData.waste} kg`],
      ['Revenue', `Rs. ${monthlyData.total_revenue.toLocaleString()}`],
      ['Raw Material Cost', `Rs. ${monthlyData.total_raw_cost.toLocaleString()}`],
      ['Worker Salaries', `Rs. ${monthlyData.total_worker_salary.toLocaleString()}`],
      ['Factory Expenses', `Rs. ${monthlyData.total_expenses.toLocaleString()}`],
      ['NET PROFIT/LOSS', `Rs. ${monthlyData.profit.toLocaleString()}`],
    ];

    doc.autoTable({
      startY: 45,
      head: [['KPI Indicator', 'Status / Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [45, 106, 45], fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });

    doc.save(`Monthly_Report_${selectedMonth}.pdf`);
  };

  const exportYearlyExcel = () => {
    if (!yearlyData.length) return;
    const ws_data = [
      [`Yearly Production Summary - ${selectedYear}`],
      ["Month", "Input (kg)", "Output (kg)", "Revenue", "Cost", "Profit"],
      ...yearlyData.map(d => [
        d.month, d.input, d.output, d.revenue, d.cost, d.profit
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Stats");
    XLSX.writeFile(wb, `Yearly_Report_${selectedYear}.xlsx`);
  };

  const renderKPI = (label, value, icon, color) => (
    <div className="card" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '24px', flexShrink: 0 }}>
        <div style={{margin: 'auto'}}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Detailed performance insights and financial tracking</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        {[
          { id: 'monthly', label: 'Monthly Report', icon: <MdDateRange /> },
          { id: 'yearly', label: 'Yearly Report', icon: <MdBarChart /> },
          { id: 'analytics', label: 'Analytics Dashboard', icon: <MdPieChart /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? 'var(--green-700)' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="filter-bar" style={{ marginBottom: '24px' }}>
        {activeTab === 'monthly' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="filter-label">Select Month:</span>
            <input 
              type="month" 
              className="premium-date-input" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
            />
            <button className="btn btn-primary" onClick={exportMonthlyPDF} style={{ marginLeft: 'auto' }}><MdDownload /> Export PDF</button>
          </div>
        )}
        {activeTab === 'yearly' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="filter-label">Select Year:</span>
            <select 
              className="premium-date-input" 
              style={{ padding: '0 16px' }}
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
            >
              {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={exportYearlyExcel} style={{ marginLeft: 'auto' }}><MdDownload /> Export Excel</button>
          </div>
        )}
        {activeTab === 'analytics' && (
           <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Real-time business performance overview</div>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {activeTab === 'monthly' && monthlyData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                {renderKPI('Total Input', `${monthlyData.total_input} kg`, <MdAgriculture />, '#10b981')}
                {renderKPI('Total Output', `${monthlyData.total_output} kg`, <MdFactory />, '#3b82f6')}
                {renderKPI('Net Profit', `₹${monthlyData.profit.toLocaleString()}`, <MdTrendingUp />, monthlyData.profit >= 0 ? '#10b981' : '#ef4444')}
                {renderKPI('Efficiency', `${monthlyData.efficiency}%`, <MdBarChart />, '#f59e0b')}
              </div>
              
              <div className="card">
                <div className="card-header"><h3>Monthly Financial Breakdown</h3></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { l: 'Revenue from Sales', v: `₹${monthlyData.total_revenue.toLocaleString()}`, color: 'var(--green-700)' },
                      { l: 'Raw Material Purchases', v: `₹${monthlyData.total_raw_cost.toLocaleString()}`, color: 'var(--text-main)' },
                      { l: 'Labor/Worker Salary', v: `₹${monthlyData.total_worker_salary.toLocaleString()}`, color: 'var(--text-main)' },
                      { l: 'Other Factory Expenses', v: `₹${monthlyData.total_expenses.toLocaleString()}`, color: 'var(--text-main)' },
                    ].map(item => (
                      <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span>{item.l}</span>
                        <span style={{ fontWeight: 700, color: item.color }}>{item.v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', background: monthlyData.profit >= 0 ? '#f0fdf4' : '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: monthlyData.profit >= 0 ? '#166534' : '#991b1b' }}>ESTIMATED PROFIT</span>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: monthlyData.profit >= 0 ? '#15803d' : '#b91c1c' }}>₹{monthlyData.profit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div className="card">
                  <div className="card-header"><h3>Monthly Performance Trend ({selectedYear})</h3></div>
                  <div className="card-body">
                    <div style={{ height: '300px' }}>
                       <Bar 
                        data={{
                          labels: yearlyData.map(d => d.month),
                          datasets: [
                            { label: 'Input (kg)', data: yearlyData.map(d => d.input), backgroundColor: '#10b981' },
                            { label: 'Output (kg)', data: yearlyData.map(d => d.output), backgroundColor: '#3b82f6' }
                          ]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false }}
                       />
                    </div>
                  </div>
               </div>

               <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Input (kg)</th>
                          <th>Output (kg)</th>
                          <th>Efficiency</th>
                          <th>Profit (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyData.map(d => (
                          <tr key={d.month}>
                            <td style={{ fontWeight: 600 }}>{d.month}</td>
                            <td>{d.input.toLocaleString()}</td>
                            <td>{d.output.toLocaleString()}</td>
                            <td>{d.input > 0 ? ((d.output/d.input)*100).toFixed(1) : 0}%</td>
                            <td style={{ color: d.profit >= 0 ? 'var(--green-700)' : 'var(--danger)', fontWeight: 700 }}>
                              ₹{d.profit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                {renderKPI('Best Supplier', analytics.best_supplier?.name || 'N/A', <MdLocalShipping />, '#3b82f6')}
                {renderKPI('Top Worker', analytics.best_worker?.name || 'N/A', <MdEngineering />, '#8b5cf6')}
                {renderKPI('Avg Efficiency', `${analytics.avg_efficiency}%`, <MdBarChart />, '#f59e0b')}
                {renderKPI('Total Batches', analytics.total_batches, <MdFactory />, '#10b981')}
              </div>

              <div className="chart-grid">
                <div className="card">
                  <div className="card-header"><h3>Supplier Contribution</h3></div>
                  <div className="card-body">
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                      <Doughnut 
                        data={{
                          labels: analytics.supplier_contribution.map(s => s.name),
                          datasets: [{
                            data: analytics.supplier_contribution.map(s => s.quantity),
                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3>Expense Distribution</h3></div>
                  <div className="card-body">
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                      <Doughnut 
                        data={{
                          labels: analytics.expense_breakdown.map(e => e.type.replace(/_/g, ' ')),
                          datasets: [{
                            data: analytics.expense_breakdown.map(e => e.amount),
                            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8d6e63']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
