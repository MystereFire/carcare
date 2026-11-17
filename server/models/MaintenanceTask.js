const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');

const MaintenanceTask = sequelize.define('MaintenanceTask', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  intervalKm: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  intervalDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lastDoneKm: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lastDoneDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isInspection: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  nextAtKm: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  nextAtDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('OK', 'SOON', 'DUE'),
    defaultValue: 'OK',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'maintenance_tasks',
  timestamps: false,
  indexes: [
    {
      fields: ['userId', 'vehicleId', 'title'],
      unique: false,
    }
  ]
});

User.hasMany(MaintenanceTask, { foreignKey: 'userId', onDelete: 'CASCADE' });
MaintenanceTask.belongsTo(User, { foreignKey: 'userId' });

Vehicle.hasMany(MaintenanceTask, { foreignKey: 'vehicleId', onDelete: 'CASCADE' });
MaintenanceTask.belongsTo(Vehicle, { foreignKey: 'vehicleId' });

MaintenanceTask.beforeSave(async (task, options) => {
  task.updatedAt = new Date();
  try {
    const VehicleModel = sequelize.models.Vehicle;
    const { computeNext, getAvgKmPerDay } = require('../services/maintenanceService');
    const vehicle = await VehicleModel.findByPk(task.vehicleId, { transaction: options.transaction });
    const avg = await getAvgKmPerDay(task.vehicleId, options.transaction);
    const updated = computeNext(task, vehicle || {}, avg);

    const isNew = task.isNewRecord;
    const oldStatus = task.previous('status');
    const newStatus = updated.status;

    task.nextAtKm = updated.nextAtKm;
    task.nextAtDate = updated.nextAtDate;
    task.status = newStatus;

    if (process.env.SMTP_USER && (isNew || newStatus !== oldStatus) && ['DUE', 'SOON'].includes(newStatus)) {
      const UserModel = sequelize.models.User;
      const user = await UserModel.findByPk(task.userId, { transaction: options.transaction });
      if (user && user.email) {
        const { sendMaintenanceAlert } = require('../services/emailService');
        const send = () => sendMaintenanceAlert(
          user.email,
          user.name,
          vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicule',
          task.title,
          newStatus,
          task.nextAtKm,
          task.nextAtDate
        ).catch(console.error);
        if (options.transaction) options.transaction.afterCommit(send);
        else send();
      }
    }
  } catch (err) {
    console.error('Error in MaintenanceTask beforeSave hook:', err);
    throw err;
  }
});

module.exports = MaintenanceTask;
