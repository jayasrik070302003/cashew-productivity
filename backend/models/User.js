const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  // role is fixed to 'admin' for this system
  role: { type: DataTypes.ENUM('admin'), defaultValue: 'admin' },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

// Instance method to validate password
User.prototype.validatePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = User;
