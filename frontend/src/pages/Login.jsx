import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { GiPeanut } from 'react-icons/gi';
import { MdWarning, MdPerson, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md';

/* ── Animated canvas particles ──────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Cashew-themed floating orbs
    const orbs = Array.from({ length: 24 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 100 + 40,
      baseDx: (Math.random() - 0.5) * 0.4,
      baseDy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.08 + 0.02,
      hue: Math.random() > 0.5 ? 120 : 35, // green or cashew-brown
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      orbs.forEach(o => {
        // Subtle attraction to mouse
        const dist = Math.hypot(o.x - mouse.current.x, o.y - mouse.current.y);
        const force = dist < 400 ? (400 - dist) / 4000 : 0;
        
        const dx = o.baseDx + (mouse.current.x - o.x) * force * 0.1;
        const dy = o.baseDy + (mouse.current.y - o.y) * force * 0.1;

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 60%, 55%, ${o.alpha})`);
        grad.addColorStop(1, `hsla(${o.hue}, 60%, 55%, 0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        o.x += dx;
        o.y += dy;
        if (o.x < -o.r) o.x = canvas.width + o.r;
        if (o.x > canvas.width + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = canvas.height + o.r;
        if (o.y > canvas.height + o.r) o.y = -o.r;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
};

/* ── Floating dots grid ─────────────────────────────── */
const DotsGrid = () => (
  <div className="login-dots" aria-hidden="true">
    {Array.from({ length: 80 }).map((_, i) => (
      <span key={i} className="login-dot" style={{ animationDelay: `${(i * 0.13) % 4}s` }} />
    ))}
  </div>
);

/* ── Main Login Component ───────────────────────────── */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState({ username: false, password: false });
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleMouseMove = (e) => {
    if (!mounted) return;
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 35;
    const y = (clientY - window.innerHeight / 2) / 35;
    setTilt({ x, y });
  };

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
      toast.success('Welcome back! 🌿');
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
    <div className="login-page-v2" onMouseMove={handleMouseMove}>
      {/* Animated layered background */}
      <ParticleCanvas />
      <DotsGrid />

      {/* Decorative rings */}
      <div className="login-ring ring-1" aria-hidden="true" />
      <div className="login-ring ring-2" aria-hidden="true" />
      <div className="login-ring ring-3" aria-hidden="true" />

      {/* Card */}
      <div 
        className={`login-card-v2 ${mounted ? 'login-card-visible' : ''}`}
        style={{
          transform: mounted 
            ? `perspective(1000px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg) translateY(0)` 
            : 'translateY(28px) scale(0.97)'
        }}
      >

        {/* Top glowing stripe */}
        <div className="login-card-stripe" />

        {/* Logo section */}
        <div className="login-brand">
          <div className="login-icon-wrap">
            <GiPeanut className="login-cashew-icon" />
            <div className="login-icon-pulse" />
          </div>
          <h1 className="login-title">Cashew Management</h1>
          <p className="login-subtitle">Industrial Processing System</p>
        </div>

        {/* Error banner */}
        {errors.general && (
          <div className="login-error-banner">
            <MdWarning size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="login-form">

          {/* Username */}
          <div className={`login-field ${focused.username || form.username ? 'login-field-active' : ''} ${errors.username ? 'login-field-error' : ''}`}>
            <label htmlFor="lf-username" className="login-field-label">Username</label>
            <div className="login-input-wrap">
              <MdPerson className="login-input-icon" />
              <input
                id="lf-username"
                type="text"
                className="login-input"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                onFocus={() => setFocused(f => ({ ...f, username: true }))}
                onBlur={() => setFocused(f => ({ ...f, username: false }))}
                autoComplete="username"
              />
            </div>
            {errors.username && <span className="login-field-err-msg">{errors.username}</span>}
          </div>

          {/* Password */}
          <div className={`login-field ${focused.password || form.password ? 'login-field-active' : ''} ${errors.password ? 'login-field-error' : ''}`}>
            <label htmlFor="lf-password" className="login-field-label">Password</label>
            <div className="login-input-wrap">
              <MdLock className="login-input-icon" />
              <input
                id="lf-password"
                type={showPw ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused(f => ({ ...f, password: true }))}
                onBlur={() => setFocused(f => ({ ...f, password: false }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            {errors.password && <span className="login-field-err-msg">{errors.password}</span>}
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className={`login-submit-btn ${submitting ? 'login-btn-loading' : ''}`}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="login-btn-spinner" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <MdArrowForward className="login-btn-arrow" />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-demo-box">
          <span className="login-demo-label">Demo Credentials</span>
          <span className="login-demo-creds">admin / admin123</span>
        </div>

        {/* Footer */}
        <p className="login-footer-text">
          Appa Cashew Industries &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
