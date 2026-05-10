import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import { 
  MdAgriculture, MdInventory2, MdAttachMoney, MdMoneyOff, 
  MdTrendingUp, MdTrendingDown, MdRecycling, MdEco, MdEngineering,
  MdLocalCafe, MdElectricBolt, MdLocalShipping, MdBuild,
  MdPieChart, MdEmojiEvents, MdFactory, MdDateRange, MdWarning
} from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtKg = (n) => `${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;

const KpiCard = ({ label, value, icon, color, sub }) => (
  <div className={`kpi-card ${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-info">
      <h4>{label}</h4>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData]   = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end)   params.end_date   = dateRange.end;
      const [dashRes, trendRes] = await Promise.all([
        api.get('/dashboard', { params }),
        api.get('/dashboard/monthly-trend'),
      ]);
      setData(dashRes.data.data);
      setTrend(trendRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Line chart data ────────────────────────────────
  const lineData = {
    labels: trend.map(t => t.month),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: trend.map(t => t.revenue),
        borderColor: '#4caf4c',
        backgroundColor: 'rgba(76,175,76,0.1)',
        fill: true, tension: 0.4, pointRadius: 4,
      },
      {
        label: 'Cost (₹)',
        data: trend.map(t => t.cost),
        borderColor: '#8d6e63',
        backgroundColor: 'rgba(141,110,99,0.08)',
        fill: true, tension: 0.4, pointRadius: 4,
      },
      {
        label: 'Profit (₹)',
        data: trend.map(t => t.profit),
        borderColor: '#0288d1',
        backgroundColor: 'rgba(2,136,209,0.08)',
        fill: false, tension: 0.4, pointRadius: 4, borderDash: [4, 3],
      },
    ],
  };

  // ── Doughnut data ──────────────────────────────────
  const expBreakdown = data?.expense_breakdown || [];
  const typeColors = { tea: '#4caf4c', electricity: '#f57c00', transport: '#0288d1', misc: '#8d6e63' };
  const doughnutData = {
    labels: expBreakdown.map(e => e.type.charAt(0).toUpperCase() + e.type.slice(1)),
    datasets: [{
      data: expBreakdown.map(e => e.amount),
      backgroundColor: expBreakdown.map(e => typeColors[e.type] || '#ccc'),
      borderWidth: 2, borderColor: '#fff',
    }],
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const profit = data?.profit ?? 0;

  return (
    <div>
      {/* ── Alert banner ── */}
      {data?.alert && (
        <div className={`alert alert-${data.alert.type}`}>{data.alert.message}</div>
      )}

      {/* ── Date filter ── */}
      <div className="filter-bar">
        <span className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdDateRange size={16} /> Filter Period:</span>
        <div className="date-input-wrapper">
          <input type="date" className="premium-date-input" value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
        </div>
        <div className="date-input-wrapper">
          <input type="date" className="premium-date-input" value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={fetchData} style={{ height: '42px', padding: '0 24px' }}>Apply Filters</button>
        <button className="btn btn-outline" onClick={() => { setDateRange({ start: '', end: '' }); fetchData(); }} style={{ height: '42px' }}>Reset</button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <KpiCard label="Total Input"    value={fmtKg(data?.total_input)}    icon={<MdAgriculture size={24} />} color="green"  sub="Raw cashew received" />
        <KpiCard label="Total Output"   value={fmtKg(data?.total_output)}   icon={<MdInventory2 size={24} />} color="brown"  sub={`Efficiency: ${data?.efficiency ?? 0}%`} />
        <KpiCard label="Total Revenue"  value={fmt(data?.total_revenue)}    icon={<MdAttachMoney size={24} />} color="blue"   sub="From all sales" />
        <KpiCard label="Total Expenses" value={fmt((data?.total_raw_cost||0)+(data?.total_worker_salary||0)+(data?.total_expenses||0))} icon={<MdMoneyOff size={24} />} color="orange" sub="Raw + Workers + Other" />
        <KpiCard label="Net Profit" value={fmt(profit)} icon={profit >= 0 ? <MdTrendingUp size={24} /> : <MdTrendingDown size={24} />} color={profit >= 0 ? 'green' : 'red'} sub={profit < 0 ? <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><MdWarning /> LOSS</span> : 'Healthy margin'} />
        <KpiCard label="Waste"          value={fmtKg(data?.waste)}          icon={<MdRecycling size={24} />} color="orange" sub="Raw − Output" />
        <KpiCard label="Raw Material Cost" value={fmt(data?.total_raw_cost)} icon={<MdEco size={24} />} color="brown" sub="All purchases" />
        <KpiCard label="Worker Salary"  value={fmt(data?.total_worker_salary)} icon={<MdEngineering size={24} />} color="purple" sub="All logs" />
      </div>

      {/* ── Charts ── */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdTrendingUp /> Monthly Revenue vs Cost Trend</h3></div>
          <div className="card-body">
            <div className="chart-container">
              <Line data={lineData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                scales: { y: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}k` } } },
              }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdPieChart /> Expense Breakdown</h3></div>
          <div className="card-body">
            <div className="chart-container" style={{ height: '250px' }}>
              <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}` } },
                },
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Insights row ── */}
      <div className="insight-grid">
        {data?.best_worker && (
          <div className="card">
            <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdEmojiEvents /> Best Worker</h3></div>
            <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '40px', display: 'flex', justifyContent: 'center' }}><MdEngineering /></div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green-700)', marginTop: '8px' }}>
                {data.best_worker.name}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {data.best_worker.quantity.toLocaleString('en-IN')} kg processed
              </div>
            </div>
          </div>
        )}

        {data?.top_expense_category && (
          <div className="card">
            <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdElectricBolt /> Top Expense Category</h3></div>
            <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '40px', display: 'flex', justifyContent: 'center' }}>
                {{ tea: <MdLocalCafe />, electricity: <MdElectricBolt />, transport: <MdLocalShipping />, misc: <MdBuild /> }[data.top_expense_category.type] || <MdMoneyOff />}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brown-700)', marginTop: '8px', textTransform: 'capitalize' }}>
                {data.top_expense_category.type}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {fmt(data.top_expense_category.amount)}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdFactory /> Batch Stats</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
              {[
                { label: 'Total Batches',    value: data?.total_batches ?? 0,     color: 'var(--green-700)' },
                { label: 'Completed',        value: data?.completed_batches ?? 0, color: 'var(--green-600)' },
                { label: 'In Progress',      value: (data?.total_batches??0)-(data?.completed_batches??0), color: 'var(--warning)' },
                { label: 'Avg Efficiency',   value: `${data?.efficiency ?? 0}%`,  color: 'var(--info)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
