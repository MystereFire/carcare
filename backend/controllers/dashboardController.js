const { Op, Sequelize } = require('sequelize');
const { Vehicle, MaintenanceTask, Expense } = require('../models');

async function getDashboardData(req, res) {
  const userId = req.user?.id || req.user?._id;
  const vehicleId = req.params.vehicleId;

  if (!userId || !vehicleId) {
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
      where: {
        _id: vehicleId,
        userId: userId,
      },
      raw: true,
    });

    const maintenancePromise = MaintenanceTask.findAll({
      where: {
        userId: userId,
        vehicleId: vehicleId,
      },
      order: [
        [
          Sequelize.literal(`CASE WHEN status = 'DUE' THEN 0 WHEN status = 'SOON' THEN 1 ELSE 2 END`),
          'ASC'
        ],
        ['nextAtDate', 'ASC']
      ],
      limit: 1,
      raw: true,
    });

    const kpiPromise = Expense.findAll({
      where: {
        userId: userId,
        vehicleId: vehicleId,
        date: { [Op.gte]: ninetyDaysAgo },
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('SUM', Sequelize.col('liters')), 'totalLiters'],
        [Sequelize.fn('SUM', Sequelize.col('km')), 'totalKm'],
      ],
      raw: true,
    });

    const distributionPromise = Expense.findAll({
      where: {
        userId: userId,
        vehicleId: vehicleId,
        date: { [Op.gte]: twelveMonthsAgo },
      },
      attributes: [
        ['type', 'type'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
      ],
      group: ['type'],
      raw: true,
    });

    const evolutionExpensesPromise = Expense.findAll({
      where: {
        userId: userId,
        vehicleId: vehicleId,
        date: { [Op.gte]: twelveMonthsAgo },
      },
      raw: true,
    });

    const recentExpensesPromise = Expense.findAll({
      where: {
        userId: userId,
        vehicleId: vehicleId,
      },
      order: [['date', 'DESC']],
      limit: 5,
      attributes: ['_id', 'date', 'label', 'amount', 'km', 'type'],
      raw: true,
    });

    const [
      vehicle,
      maintenanceArr,
      kpiAgg,
      distributionAgg,
      evolutionExpenses,
      recentExpenses,
    ] = await Promise.all([
      vehiclePromise,
      maintenancePromise,
      kpiPromise,
      distributionPromise,
      evolutionExpensesPromise,
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

    // Process monthly evolution in JS to ensure cross-database SQL portability
    const evolutionGroups = {};
    for (const exp of evolutionExpenses) {
      if (!exp.date) continue;
      const d = new Date(exp.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      evolutionGroups[key] = (evolutionGroups[key] || 0) + (exp.amount || 0);
    }

    const monthlySeries = [];
    const cursor = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      monthlySeries.push({
        month: key,
        total: evolutionGroups[key] || 0,
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
          type: d.type || 'unknown',
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
