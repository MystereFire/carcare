const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const MaintenanceTask = require('../models/MaintenanceTask');
const Expense = require('../models/Expense');

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

async function getDashboardData(req, res) {
  const userId = req.user?.id || req.user?._id;
  const vehicleId = req.params.vehicleId;

  const userObjectId = toObjectId(userId);
  const vehicleObjectId = toObjectId(vehicleId);

  if (!userObjectId || !vehicleObjectId) {
    return res.status(400).json({ error: 'Identifiants invalides' });
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);

  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  try {
    const vehiclePromise = Vehicle.findOne({
      _id: vehicleObjectId,
      userId: userObjectId,
    }).lean();

    const maintenancePromise = MaintenanceTask.aggregate([
      {
        $match: {
          userId: userObjectId,
          vehicleId: vehicleObjectId,
        },
      },
      {
        $addFields: {
          statusWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'DUE'] }, then: 0 },
                { case: { $eq: ['$status', 'SOON'] }, then: 1 },
              ],
              default: 2,
            },
          },
        },
      },
      { $sort: { statusWeight: 1, nextAtDate: 1 } },
      { $limit: 1 },
    ]);

    const kpiPromise = Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          vehicleId: vehicleObjectId,
          date: { $gte: ninetyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          totalLiters: { $sum: { $ifNull: ['$liters', 0] } },
          totalKm: { $sum: { $ifNull: ['$km', 0] } },
        },
      },
    ]);

    const distributionPromise = Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          vehicleId: vehicleObjectId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
      { $project: { _id: 0, type: { $ifNull: ['$_id', 'unknown'] }, total: 1 } },
    ]);

    const evolutionPromise = Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          vehicleId: vehicleObjectId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const recentExpensesPromise = Expense.find({
      userId: userObjectId,
      vehicleId: vehicleObjectId,
    })
      .sort({ date: -1 })
      .limit(5)
      .select({ date: 1, label: 1, amount: 1, km: 1, type: 1 })
      .lean();

    const [
      vehicle,
      maintenanceArr,
      kpiAgg,
      distributionAgg,
      evolutionAgg,
      recentExpenses,
    ] = await Promise.all([
      vehiclePromise,
      maintenancePromise,
      kpiPromise,
      distributionPromise,
      evolutionPromise,
      recentExpensesPromise,
    ]);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicule introuvable' });
    }

    const kpiDoc = kpiAgg[0] || { totalAmount: 0, totalLiters: 0, totalKm: 0 };
    const totalAmount = Number(kpiDoc.totalAmount || 0);
    const totalLiters = Number(kpiDoc.totalLiters || 0);
    const totalKm = Number(kpiDoc.totalKm || 0);

    const costPer100Km = totalKm > 0 ? (totalAmount * 100) / totalKm : 0;
    const litersPer100Km = totalKm > 0 ? (totalLiters * 100) / totalKm : 0;

    const monthsMap = new Map(
      evolutionAgg.map((m) => {
        const monthKey = `${m._id.year}-${String(m._id.month).padStart(2, '0')}`;
        return [monthKey, Number(m.total || 0)];
      }),
    );

    const monthlySeries = [];
    const cursor = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      monthlySeries.push({
        month: key,
        total: monthsMap.get(key) || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return res.json({
      vehicle,
      maintenance: maintenanceArr[0] || null,
      kpis: {
        last90Days: {
          totalAmount,
          totalLiters,
          totalKm,
          costPer100Km,
          litersPer100Km,
        },
      },
      distribution: {
        annualByType: distributionAgg.map((d) => ({
          type: d.type,
          total: Number(d.total || 0),
        })),
      },
      evolution: {
        monthly: monthlySeries,
      },
      recentExpenses: recentExpenses.map((exp) => ({
        _id: exp._id,
        date: exp.date,
        label: exp.label,
        amount: Number(exp.amount || 0),
        km: exp.km != null ? Number(exp.km) : null,
        type: exp.type || 'unknown',
      })),
    });
  } catch (err) {
    console.error('Erreur dashboard:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getDashboardData,
};
