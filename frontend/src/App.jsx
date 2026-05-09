import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import RawMaterials from './pages/RawMaterials';
import Suppliers   from './pages/Suppliers';
import Batches     from './pages/Batches';
import Workers     from './pages/Workers';
import Expenses    from './pages/Expenses';
import Sales       from './pages/Sales';
import Reports     from './pages/Reports';
import WorkerProductivity from './pages/WorkerProductivity';

import { useState } from 'react';

// Protected layout wrapper
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"   element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/raw"         element={<ProtectedLayout><RawMaterials /></ProtectedLayout>} />
      <Route path="/suppliers"   element={<ProtectedLayout><Suppliers /></ProtectedLayout>} />
      <Route path="/batches"     element={<ProtectedLayout><Batches /></ProtectedLayout>} />
      <Route path="/workers"     element={<ProtectedLayout><Workers /></ProtectedLayout>} />
      <Route path="/productivity" element={<ProtectedLayout><WorkerProductivity /></ProtectedLayout>} />
      <Route path="/expenses"    element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
      <Route path="/sales"       element={<ProtectedLayout><Sales /></ProtectedLayout>} />
      <Route path="/reports"     element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
