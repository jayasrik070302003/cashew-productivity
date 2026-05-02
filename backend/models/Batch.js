const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Batch = sequelize.define('Batch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  batch_code: { type: DataTypes.STRING(50), allowNull: true, comment: 'e.g. BATCH-2024-001' },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'suppliers', key: 'id' },
  },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
  raw_quantity_used: { type: DataTypes.FLOAT, allowNull: false, comment: 'kg of raw cashew used' },
  output_quantity: { type: DataTypes.FLOAT, allowNull: true, comment: 'kg of processed cashew output' },
  // Auto-calculated virtuals (stored for quick retrieval)
  efficiency: { type: DataTypes.FLOAT, allowNull: true, comment: '(output/raw)*100' },
  waste: { type: DataTypes.FLOAT, allowNull: true, comment: 'raw - output in kg' },
  status: { type: DataTypes.ENUM('in_progress', 'completed'), defaultValue: 'in_progress' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'batches',
  timestamps: true,
  hooks: {
    beforeCreate: (batch) => {
      if (batch.output_quantity != null) {
        batch.efficiency = parseFloat(((batch.output_quantity / batch.raw_quantity_used) * 100).toFixed(2));
        batch.waste = parseFloat((batch.raw_quantity_used - batch.output_quantity).toFixed(2));
        batch.status = 'completed';
      }
    },
    beforeUpdate: (batch) => {
      if (batch.output_quantity != null) {
        batch.efficiency = parseFloat(((batch.output_quantity / batch.raw_quantity_used) * 100).toFixed(2));
        batch.waste = parseFloat((batch.raw_quantity_used - batch.output_quantity).toFixed(2));
        batch.status = 'completed';
      }
    },
  },
});

module.exports = Batch;
