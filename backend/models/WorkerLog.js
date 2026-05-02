const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkerLog = sequelize.define('WorkerLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  worker_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'workers', key: 'id' },
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'batches', key: 'id' },
  },
  quantity_processed: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Used when payment_type is per_kg',
  },
  working_days: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Used when payment_type is daily',
  },
  // salary = quantity_processed * rate  OR  working_days * rate
  salary: { type: DataTypes.FLOAT, allowNull: false },
  log_date: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'worker_logs',
  timestamps: true,
});

module.exports = WorkerLog;
