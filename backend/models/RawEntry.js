const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RawEntry = sequelize.define('RawEntry', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'suppliers', key: 'id' },
  },
  quantity: { type: DataTypes.FLOAT, allowNull: false, comment: 'in kg' },
  cost_per_kg: { type: DataTypes.FLOAT, allowNull: false },
  // Auto-calculated: quantity * cost_per_kg
  total_cost: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'raw_entries',
  timestamps: true,
  hooks: {
    beforeCreate: (entry) => {
      entry.total_cost = parseFloat((entry.quantity * entry.cost_per_kg).toFixed(2));
    },
    beforeUpdate: (entry) => {
      entry.total_cost = parseFloat((entry.quantity * entry.cost_per_kg).toFixed(2));
    },
  },
});

module.exports = RawEntry;
