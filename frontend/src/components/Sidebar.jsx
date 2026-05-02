import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdAgriculture, MdLocalShipping, MdFactory,
  MdEngineering, MdListAlt, MdMoneyOff, MdAttachMoney, MdBarChart,
  MdLogout
} from 'react-icons/md';
import { GiPeanut } from 'react-icons/gi';

const navItems = [
  { path: '/dashboard',    icon: <MdDashboard />, label: 'Dashboard',      section: 'OVERVIEW' },
  { path: '/raw',          icon: <MdAgriculture />, label: 'Raw Materials',  section: 'OPERATIONS' },
  { path: '/suppliers',    icon: <MdLocalShipping />, label: 'Suppliers',      section: 'OPERATIONS' },
  { path: '/batches',      icon: <MdFactory />, label: 'Batches',        section: 'OPERATIONS' },
  { path: '/workers',      icon: <MdEngineering />, label: 'Workers',        section: 'WORKFORCE' },
  { path: '/worker-logs',  icon: <MdListAlt />, label: 'Worker Logs',    section: 'WORKFORCE' },
  { path: '/productivity', icon: <MdBarChart />, label: 'Daily Productivity', section: 'WORKFORCE' },
  { path: '/expenses',     icon: <MdMoneyOff />, label: 'Expenses',       section: 'FINANCE' },
  { path: '/sales',        icon: <MdAttachMoney />, label: 'Sales',          section: 'FINANCE' },
  { path: '/reports',      icon: <MdBarChart />, label: 'Reports',        section: 'FINANCE' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  let lastSection = '';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon"><GiPeanut /></div>
        <div className="logo-text">
          <h2>Cashew Processing<br/>Management System</h2>
          <p>Industrial Dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section !== lastSection;
          lastSection = item.section;
          return (
            <div key={item.path}>
              {showSection && <div className="nav-section-label">{item.section}</div>}
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '10px' }}>
          Logged in as <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{user?.username}</strong>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdLogout /> Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
