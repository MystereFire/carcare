const { Vehicle, MaintenanceTask, Expense } = require('../models');
const { computeNext, getAvgKmPerDay } = require('../services/maintenanceService');
const { getConsumptionSegments } = require('../services/consumptionService');
const input = require('../services/input');

async function getDashboardData(req, res) {
  try {
    const userId = req.user._id;
    const vehicleId = req.params.vehicleId;
    const vehicle = input.validId(vehicleId) && await Vehicle.findOne({ where: { _id: vehicleId, userId }, raw: true });
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const [expenses, tasks, avg, segments] = await Promise.all([
      Expense.findAll({ where: { vehicleId, userId }, order: [['date', 'ASC'], ['km', 'ASC'], ['_id', 'ASC']], raw: true }),
      MaintenanceTask.findAll({ where: { vehicleId, userId }, raw: true }),
      getAvgKmPerDay(vehicleId),
      getConsumptionSegments(vehicleId, userId),
    ]);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const period = expenses.filter(exp => exp.date && new Date(exp.date) >= ninetyDaysAgo && new Date(exp.date) <= now);
    const readings = period.filter(exp => exp.km != null && Number.isFinite(Number(exp.km))).map(exp => Number(exp.km));
    const previousReading = expenses.filter(exp => exp.km != null && exp.date && new Date(exp.date) < ninetyDaysAgo).at(-1);
    if (previousReading) readings.unshift(Number(previousReading.km));
    const totalKm = readings.length > 1 ? Math.max(0, readings.at(-1) - readings[0]) : 0;
    const totalAmount = period.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalLiters = period.filter(exp => exp.type === 'fuel').reduce((sum, exp) => sum + (Number(exp.liters) || 0), 0);
    const validSegments = segments.filter(segment => !segment.isSuspect && new Date(segment.endDate) >= ninetyDaysAgo && new Date(segment.endDate) <= now);
    const fuelKm = validSegments.reduce((sum, segment) => sum + segment.km, 0);
    const fuelLiters = validSegments.reduce((sum, segment) => sum + segment.liters, 0);
    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + i, 1)).toISOString().slice(0, 7), total: 0 }));
    const byType = new Map();
    for (const expense of expenses) {
      if (!expense.date || new Date(expense.date) < firstMonth || new Date(expense.date) > now) continue;
      const amount = Number(expense.amount) || 0;
      byType.set(expense.type, (byType.get(expense.type) || 0) + amount);
      const month = monthly.find(item => item.month === new Date(expense.date).toISOString().slice(0, 7));
      if (month) month.total += amount;
    }
    const priority = { DUE: 0, SOON: 1, OK: 2 };
    const maintenance = tasks.map(task => computeNext(task, vehicle, avg)).sort((a, b) => priority[a.status] - priority[b.status] || (a.nextAtDate ? new Date(a.nextAtDate).getTime() : Infinity) - (b.nextAtDate ? new Date(b.nextAtDate).getTime() : Infinity))[0] || null;
    res.json({
      vehicle,
      maintenance,
      kpis: { last90Days: { totalAmount, totalLiters, totalKm, costPer100Km: totalKm > 0 ? totalAmount * 100 / totalKm : null, litersPer100Km: fuelKm > 0 ? fuelLiters * 100 / fuelKm : null } },
      distribution: { annualByType: Array.from(byType, ([type, total]) => ({ type, total })) },
      evolution: { monthly },
      recentExpenses: [...expenses].reverse().slice(0, 5).map(exp => ({ _id: exp._id, date: exp.date, label: exp.label, amount: Number(exp.amount) || 0, km: exp.km == null ? null : Number(exp.km), type: exp.type })),
    });
  } catch (err) { input.respondError(res, err); }
}

module.exports = { getDashboardData };
