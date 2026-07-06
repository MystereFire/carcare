const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');

const Expense = sequelize.define('Expense', {
  _id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: '_id',
    },
    onDelete: 'CASCADE',
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Vehicle,
      key: '_id',
    },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.ENUM('fuel', 'maintenance', 'repair'),
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  km: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  liters: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  isFullFill: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'expenses',
  timestamps: false,
});

User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', onDelete: 'CASCADE' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId' });

module.exports = Expense;
