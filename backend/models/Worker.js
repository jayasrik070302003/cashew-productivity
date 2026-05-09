const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Worker = sequelize.define('Worker', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  role: {
    type: DataTypes.ENUM('breaking', 'drying', 'sorting'),
    allowNull: false,
    comment: 'Stage of cashew processing',
  },
  payment_type: {
    type: DataTypes.ENUM('daily', 'per_kg'),
    allowNull: false,
  },
  rate: { type: DataTypes.FLOAT, allowNull: true, comment: 'Rate per day or per kg' },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'workers',
  timestamps: true,
  paranoid: true,
});

module.exports = Worker;
