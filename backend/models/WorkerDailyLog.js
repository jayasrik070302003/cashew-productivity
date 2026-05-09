const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkerDailyLog = sequelize.define('WorkerDailyLog', {
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
  date: { type: DataTypes.DATEONLY, allowNull: false },
  quantity_processed: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'worker_daily_logs',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['worker_id', 'date', 'batch_id']
    }
  ]
});

module.exports = WorkerDailyLog;
