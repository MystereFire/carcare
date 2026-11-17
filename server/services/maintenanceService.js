const Expense = require('../models/Expense');

function computeStatus(task, vehicle, avgKmPerDay) {
  const currentOdometer = Number(vehicle?.currentOdometer) || 0;
  const nextAtKm = task.nextAtKm;
  const nextAtDate = task.nextAtDate ? new Date(task.nextAtDate) : null;

  const distanceRemaining = nextAtKm != null ? nextAtKm - currentOdometer : Infinity;
  // Compare calendar days, so clock time does not shift due-today status.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysRemaining = nextAtDate ? (nextAtDate - today) / 86400000 : Infinity;
  const etaDaysFromKm = distanceRemaining / (avgKmPerDay || 30);
  const eta = Math.min(daysRemaining, etaDaysFromKm);

  if (distanceRemaining <= 0 || daysRemaining <= 0) return 'DUE';
  if (eta <= 30 || distanceRemaining <= 1000) return 'SOON';
  return 'OK';
}

function computeNext(task, vehicle, avgKmPerDay) {
  task.nextAtKm = null;
  task.nextAtDate = null;
  if (task.isInspection) {
    task.nextAtDate = task.inspectionDate ? new Date(task.inspectionDate) : null;
  } else {
    if (task.intervalKm != null && task.lastDoneKm != null) task.nextAtKm = Number(task.lastDoneKm) + Number(task.intervalKm);
    if (task.intervalDays != null && task.lastDoneDate) task.nextAtDate = new Date(new Date(task.lastDoneDate).getTime() + Number(task.intervalDays) * 86400000);
  }
  task.status = computeStatus(task, vehicle, avgKmPerDay);
  return task;
}

async function getAvgKmPerDay(vehicleId, transaction) {
  const { Op } = require('sequelize');
  const expenses = await Expense.findAll({
    where: {
      vehicleId,
      km: { [Op.ne]: null }
    },
    order: [['date', 'ASC'], ['km', 'ASC']],
    transaction,
  });
  if (expenses.length < 2) {
    return 0;
  }
  const readings = expenses.filter(exp => exp.date && Number.isFinite(Number(exp.km)));
  if (readings.length < 2) return 0;
  const first = readings[0];
  const last = readings[readings.length - 1];
  const days = (new Date(last.date) - new Date(first.date)) / 86400000;
  const dist = last.km - first.km;
  return days > 0 && dist > 0 ? dist / days : 0;
}

module.exports = {
  computeNext,
  computeStatus,
  getAvgKmPerDay,
};
