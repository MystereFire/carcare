const Expense = require('../models/Expense');

function computeStatus(task, vehicle, avgKmPerDay) {
  const currentOdometer = vehicle && vehicle.currentOdometer ? vehicle.currentOdometer : 0;
  const nextAtKm = task.nextAtKm;
  const nextAtDate = task.nextAtDate ? new Date(task.nextAtDate) : null;

  const distanceRemaining = nextAtKm != null ? nextAtKm - currentOdometer : Infinity;
  const daysRemaining = nextAtDate ? (nextAtDate - Date.now()) / 86400000 : Infinity;
  const etaDaysFromKm = distanceRemaining / (avgKmPerDay || 30);
  const eta = Math.min(daysRemaining, etaDaysFromKm);

  if (distanceRemaining <= 0 || daysRemaining <= 0) return 'DUE';
  if (eta <= 30 || distanceRemaining <= 1000) return 'SOON';
  return 'OK';
}

function computeNext(task, vehicle, avgKmPerDay) {
  if (task.intervalKm != null && task.lastDoneKm != null) {
    task.nextAtKm = task.lastDoneKm + task.intervalKm;
  }
  if (task.intervalDays != null && task.lastDoneDate) {
    task.nextAtDate = new Date(task.lastDoneDate.getTime() + task.intervalDays * 86400000);
  }
  task.status = computeStatus(task, vehicle, avgKmPerDay);
  return task;
}

async function getAvgKmPerDay(vehicleId) {
  const { Op } = require('sequelize');
  const expenses = await Expense.findAll({
    where: {
      vehicleId,
      km: { [Op.ne]: null }
    },
    order: [['date', 'ASC']]
  });
  if (expenses.length < 2) {
    return 0;
  }
  const first = expenses[0];
  const last = expenses[expenses.length - 1];
  const days = (new Date(last.date) - new Date(first.date)) / 86400000;
  const dist = last.km - first.km;
  return days > 0 ? dist / days : 0;
}

module.exports = {
  computeNext,
  computeStatus,
  getAvgKmPerDay,
};
