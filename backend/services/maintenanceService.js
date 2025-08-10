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

const cache = new Map();
async function getAvgKmPerDay(vehicleId) {
  const cached = cache.get(vehicleId);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.value;

  const expenses = await Expense.find({ vehicleId, km: { $exists: true } }).sort({ date: 1 });
  if (expenses.length < 2) {
    cache.set(vehicleId, { value: 0, expires: now + 3600 * 1000 });
    return 0;
  }
  const first = expenses[0];
  const last = expenses[expenses.length - 1];
  const days = (last.date - first.date) / 86400000;
  const dist = last.km - first.km;
  const avg = days > 0 ? dist / days : 0;
  cache.set(vehicleId, { value: avg, expires: now + 3600 * 1000 });
  return avg;
}

module.exports = {
  computeNext,
  computeStatus,
  getAvgKmPerDay,
};
