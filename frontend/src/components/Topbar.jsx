import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GiPeanut } from 'react-icons/gi';
import { MdMenu } from 'react-icons/md';

const pageTitles = {
  '/dashboard':   'Dashboard Overview',
  '/raw':         'Raw Materials',
  '/suppliers':   'Suppliers',
  '/batches':     'Batch Processing',
  '/workers':     'Workers',
  '/worker-logs': 'Worker Logs',
  '/expenses':    'Expenses',
  '/sales':       'Sales',
  '/reports':     'Reports & Analytics',
};

const Topbar = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = pageTitles[pathname] || 'Cashew Management';

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuClick}><MdMenu /></button>
      <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GiPeanut /> {title}</div>
      <div className="topbar-user">
        <span className="date-str" style={{ fontSize: '12px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>{user?.username}</div>
          <div className="user-role" style={{ fontSize: '11px' }}>Administrator</div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
