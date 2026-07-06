const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Expense = require('./Expense');
const MaintenanceTask = require('./MaintenanceTask');

module.exports = {
  sequelize,
  User,
  Vehicle,
  Expense,
  MaintenanceTask,
};
