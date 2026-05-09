const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity_sold: { type: DataTypes.FLOAT, allowNull: false, comment: 'kg sold' },
  price_per_kg: { type: DataTypes.FLOAT, allowNull: false },
  // Auto-calculated: quantity_sold * price_per_kg
  total_revenue: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  buyer_name: { type: DataTypes.STRING(150), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'sales',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeCreate: (sale) => {
      sale.total_revenue = parseFloat((sale.quantity_sold * sale.price_per_kg).toFixed(2));
    },
    beforeUpdate: (sale) => {
      sale.total_revenue = parseFloat((sale.quantity_sold * sale.price_per_kg).toFixed(2));
    },
  },
});

module.exports = Sale;
