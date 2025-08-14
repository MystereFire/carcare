const Expense = require('../models/Expense');

async function getConsumptionSegments(vehicleId, userId) {
  const expenses = await Expense.find({ vehicleId, userId, type: 'fuel' }).sort({ date: 1 });

  const segments = [];
  let lastFull = null;
  let liters = 0;
  let price = 0;

  for (const exp of expenses) {
    liters += exp.liters || 0;
    price += exp.amount || 0;

    if (exp.isFullFill) {
      if (lastFull && exp.km > lastFull.km && liters > 0) {
        const km = exp.km - lastFull.km;
        const consumption = parseFloat(((liters * 100) / km).toFixed(2));
        const costPer100 = parseFloat(((price * 100) / km).toFixed(2));
        segments.push({
          startDate: lastFull.date,
          endDate: exp.date,
          km,
          liters,
          price,
          consumption,
          costPer100,
        });
      }
      lastFull = exp;
      liters = 0;
      price = 0;
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
