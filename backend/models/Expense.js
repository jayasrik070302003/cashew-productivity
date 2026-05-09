const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: {
    type: DataTypes.ENUM('tea', 'electricity', 'transport', 'misc'),
    allowNull: false,
  },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'expenses',
  timestamps: true,
  paranoid: true,
});

module.exports = Expense;
