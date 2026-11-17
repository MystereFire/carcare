const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Vehicle = sequelize.define('Vehicle', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tankSize: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  initialKm: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  currentOdometer: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  acquisitionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  technicalInspectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'vehicles',
  timestamps: false,
});

User.hasMany(Vehicle, { foreignKey: 'userId', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'userId' });

module.exports = Vehicle;
