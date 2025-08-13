const Expense = require('../models/Expense');

async function getConsumptionSegments(vehicleId, userId) {
  const expenses = await Expense.find({ vehicleId, userId, type: 'fuel' }).sort({ date: 1 });

  const segments = [];

  for (let i = 1; i < expenses.length; i++) {
    const prev = expenses[i - 1];
    const curr = expenses[i];
    const km = curr.km - prev.km;
    const liters = curr.liters || 0;
    const price = curr.amount || 0;

    if (km > 0 && liters > 0) {
      const consumption = parseFloat(((liters * 100) / km).toFixed(2));
      const costPer100 = parseFloat(((price * 100) / km).toFixed(2));
      segments.push({
        startDate: prev.date,
        endDate: curr.date,
        km,
        liters,
        price,
        consumption,
        costPer100,
      });
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const slice = segments.slice(Math.max(0, i - 2), i + 1);
    const avgCons = slice.reduce((s, seg) => s + seg.consumption, 0) / slice.length;
    const avgCost = slice.reduce((s, seg) => s + seg.costPer100, 0) / slice.length;
    segments[i].avgConsumption = parseFloat(avgCons.toFixed(2));
    segments[i].avgCostPer100 = parseFloat(avgCost.toFixed(2));
  }

  return segments;
}

module.exports = { getConsumptionSegments };
