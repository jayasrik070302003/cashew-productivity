// ─────────────────────────────────────────────
// Central index: associates all models
// ─────────────────────────────────────────────
const sequelize = require('../config/db');
const User      = require('./User');
const Supplier  = require('./Supplier');
const RawEntry  = require('./RawEntry');
const Batch     = require('./Batch');
const Worker    = require('./Worker');
const WorkerLog      = require('./WorkerLog');
const WorkerDailyLog = require('./WorkerDailyLog');
const Expense        = require('./Expense');
const Sale           = require('./Sale');

// ── Associations ──────────────────────────────
Supplier.hasMany(RawEntry, { foreignKey: 'supplier_id', as: 'rawEntries' });
RawEntry.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Batch.hasMany(WorkerLog, { foreignKey: 'batch_id', as: 'workerLogs' });
WorkerLog.belongsTo(Batch, { foreignKey: 'batch_id', as: 'batch' });

Worker.hasMany(WorkerLog, { foreignKey: 'worker_id', as: 'logs' });
WorkerLog.belongsTo(Worker, { foreignKey: 'worker_id', as: 'worker' });

Worker.hasMany(WorkerDailyLog, { foreignKey: 'worker_id', as: 'dailyLogs' });
WorkerDailyLog.belongsTo(Worker, { foreignKey: 'worker_id', as: 'worker' });

module.exports = {
  sequelize,
  User,
  Supplier,
  RawEntry,
  Batch,
  Worker,
  WorkerLog,
  WorkerDailyLog,
  Expense,
  Sale,
};
