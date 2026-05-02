// ═══════════════════════════════════════════════════
// Cashew Processing Management System — Backend Entry
// ═══════════════════════════════════════════════════
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { sequelize, User } = require('./models');

// ── Route Imports ───────────────────────────────────
const authRoutes       = require('./routes/auth');
const supplierRoutes   = require('./routes/suppliers');
const rawRoutes        = require('./routes/raw');
const batchRoutes      = require('./routes/batches');
const workerRoutes     = require('./routes/workers');
const workerLogRoutes  = require('./routes/workerLogs');
const expenseRoutes    = require('./routes/expenses');
const salesRoutes      = require('./routes/sales');
const dashboardRoutes  = require('./routes/dashboard');

// ── Middleware Imports ──────────────────────────────
const authMiddleware  = require('./middlewares/auth');
const errorHandler    = require('./middlewares/errorHandler');

const app = express();

// ── Global Middlewares ──────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── Public Routes (no JWT needed) ──────────────────
app.use('/api/auth', authRoutes);

// ── Protected Routes (JWT required) ────────────────
app.use('/api/suppliers',   authMiddleware, supplierRoutes);
app.use('/api/raw',         authMiddleware, rawRoutes);
app.use('/api/batches',     authMiddleware, batchRoutes);
app.use('/api/workers',     authMiddleware, workerRoutes);
app.use('/api/worker-logs', authMiddleware, workerLogRoutes);
app.use('/api/worker-daily', authMiddleware, require('./routes/workerDaily'));
app.use('/api/expenses',    authMiddleware, expenseRoutes);
app.use('/api/sales',       authMiddleware, salesRoutes);
app.use('/api/dashboard',   authMiddleware, dashboardRoutes);

// ── 404 Handler ─────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` })
);

// ── Global Error Handler ────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Sync all models → creates tables if they don't exist
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced to database.');

    // ── Seed Admin User ──────────────────────────────
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('🌱 Seeded default admin user: admin / admin123');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Cashew Backend running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
