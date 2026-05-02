import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { GiPeanut } from 'react-icons/gi';
import { MdWarning, MdHourglassEmpty, MdLock } from 'react-icons/md';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password)        e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check credentials.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-emoji"><GiPeanut /></div>
          <h1>Cashew Management</h1>
          <p>Industrial Processing System</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdWarning /> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className={`form-control ${errors.username ? 'error' : ''}`}
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
            {errors.username && <div className="error-msg">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            {errors.password && <div className="error-msg">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdHourglassEmpty /> Signing in...</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdLock /> Sign In</span>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', padding: '14px', background: 'var(--green-50)', borderRadius: 'var(--radius)', border: '1px solid var(--green-100)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Demo Credentials</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-700)' }}>admin / admin123</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
