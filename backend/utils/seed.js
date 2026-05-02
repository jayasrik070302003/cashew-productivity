// ═══════════════════════════════════════════════════
// Seed Script — Populates dummy data for demo/testing
// Run: node utils/seed.js
// ═══════════════════════════════════════════════════
require('dotenv').config();
const { sequelize, User, Supplier, RawEntry, Batch, Worker, WorkerLog, Expense, Sale } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // ⚠️ Drops and recreates all tables
    console.log('✅ DB synced. Seeding...');

    // ── Admin User ───────────────────────────────────
    const admin = await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
    console.log(`👤 User: admin / admin123`);

    // ── Suppliers ────────────────────────────────────
    const [s1, s2, s3] = await Supplier.bulkCreate([
      { name: 'Rajan Farms', contact: '9876543210', address: 'Kollam, Kerala' },
      { name: 'Kerala Cashew Co.', contact: '9123456789', address: 'Kasaragod, Kerala' },
      { name: 'Konkan Traders', contact: '9012345678', address: 'Sindhudurg, Maharashtra' },
    ]);
    console.log('🌾 Suppliers created');

    // ── Raw Material Entries ──────────────────────────
    await RawEntry.bulkCreate([
      { supplier_id: s1.id, quantity: 500, cost_per_kg: 85, total_cost: 42500, date: '2025-01-05' },
      { supplier_id: s2.id, quantity: 300, cost_per_kg: 90, total_cost: 27000, date: '2025-01-12' },
      { supplier_id: s1.id, quantity: 400, cost_per_kg: 87, total_cost: 34800, date: '2025-02-03' },
      { supplier_id: s3.id, quantity: 600, cost_per_kg: 82, total_cost: 49200, date: '2025-02-18' },
      { supplier_id: s2.id, quantity: 350, cost_per_kg: 92, total_cost: 32200, date: '2025-03-07' },
      { supplier_id: s1.id, quantity: 450, cost_per_kg: 88, total_cost: 39600, date: '2025-03-20' },
    ]);
    console.log('📦 Raw entries created');

    // ── Batches ───────────────────────────────────────
    const [b1, b2, b3] = await Batch.bulkCreate([
      { batch_code: 'BATCH-2025-001', start_date: '2025-01-08', end_date: '2025-01-20', raw_quantity_used: 500, output_quantity: 310, efficiency: 62, waste: 190, status: 'completed' },
      { batch_code: 'BATCH-2025-002', start_date: '2025-02-05', end_date: '2025-02-22', raw_quantity_used: 700, output_quantity: 420, efficiency: 60, waste: 280, status: 'completed' },
      { batch_code: 'BATCH-2025-003', start_date: '2025-03-10', end_date: null, raw_quantity_used: 450, output_quantity: null, efficiency: null, waste: null, status: 'in_progress' },
    ]);
    console.log('🏭 Batches created');

    // ── Workers ───────────────────────────────────────
    const [w1, w2, w3, w4, w5] = await Worker.bulkCreate([
      { name: 'Murugan K.',      role: 'breaking', payment_type: 'per_kg', rate: 8,   phone: '9011122233' },
      { name: 'Selvi R.',        role: 'drying',   payment_type: 'daily',  rate: 450, phone: '9022233344' },
      { name: 'Ravi S.',         role: 'sorting',  payment_type: 'per_kg', rate: 10,  phone: '9033344455' },
      { name: 'Lakshmi P.',      role: 'breaking', payment_type: 'daily',  rate: 400, phone: '9044455566' },
      { name: 'Arumugam T.',     role: 'sorting',  payment_type: 'per_kg', rate: 9,   phone: '9055566677' },
    ]);
    console.log('👷 Workers created');

    // ── Worker Logs ───────────────────────────────────
    await WorkerLog.bulkCreate([
      { worker_id: w1.id, batch_id: b1.id, quantity_processed: 500, working_days: null, salary: 4000, log_date: '2025-01-15' },
      { worker_id: w2.id, batch_id: b1.id, quantity_processed: null, working_days: 10,  salary: 4500, log_date: '2025-01-15' },
      { worker_id: w3.id, batch_id: b1.id, quantity_processed: 310, working_days: null, salary: 3100, log_date: '2025-01-20' },
      { worker_id: w1.id, batch_id: b2.id, quantity_processed: 700, working_days: null, salary: 5600, log_date: '2025-02-18' },
      { worker_id: w4.id, batch_id: b2.id, quantity_processed: null, working_days: 14,  salary: 5600, log_date: '2025-02-22' },
      { worker_id: w5.id, batch_id: b2.id, quantity_processed: 420, working_days: null, salary: 3780, log_date: '2025-02-22' },
      { worker_id: w1.id, batch_id: b3.id, quantity_processed: 200, working_days: null, salary: 1600, log_date: '2025-03-18' },
      { worker_id: w2.id, batch_id: b3.id, quantity_processed: null, working_days: 8,   salary: 3600, log_date: '2025-03-18' },
    ]);
    console.log('📝 Worker logs created');

    // ── Expenses ──────────────────────────────────────
    await Expense.bulkCreate([
      { type: 'electricity', amount: 8500,  date: '2025-01-31', description: 'Monthly electricity bill' },
      { type: 'tea',         amount: 2200,  date: '2025-01-31', description: 'Tea & refreshments for workers' },
      { type: 'transport',   amount: 5500,  date: '2025-01-20', description: 'Cashew raw material transport' },
      { type: 'misc',        amount: 1200,  date: '2025-01-25', description: 'Tools & maintenance' },
      { type: 'electricity', amount: 9200,  date: '2025-02-28', description: 'Monthly electricity bill' },
      { type: 'transport',   amount: 6800,  date: '2025-02-22', description: 'Delivery to buyers' },
      { type: 'tea',         amount: 2500,  date: '2025-02-28', description: 'Tea & refreshments' },
      { type: 'misc',        amount: 3000,  date: '2025-02-15', description: 'Machine repair' },
      { type: 'electricity', amount: 8800,  date: '2025-03-31', description: 'Monthly electricity bill' },
      { type: 'transport',   amount: 4500,  date: '2025-03-20', description: 'Raw material transport' },
    ]);
    console.log('💸 Expenses created');

    // ── Sales ─────────────────────────────────────────
    await Sale.bulkCreate([
      { quantity_sold: 200, price_per_kg: 280, total_revenue: 56000, date: '2025-01-25', buyer_name: 'Ramesh Traders' },
      { quantity_sold: 110, price_per_kg: 290, total_revenue: 31900, date: '2025-01-28', buyer_name: 'Meenakshi Exports' },
      { quantity_sold: 250, price_per_kg: 275, total_revenue: 68750, date: '2025-02-25', buyer_name: 'Anand Wholesale' },
      { quantity_sold: 170, price_per_kg: 285, total_revenue: 48450, date: '2025-03-05', buyer_name: 'Ramesh Traders' },
      { quantity_sold: 130, price_per_kg: 295, total_revenue: 38350, date: '2025-03-15', buyer_name: 'Meenakshi Exports' },
    ]);
    console.log('💰 Sales created');

    console.log('\n✅ Seeding complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials: admin / admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
