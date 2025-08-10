const Expense = require('../models/Expense');

async function getConsumptionSegments(vehicleId, userId) {
  const expenses = await Expense.find({ vehicleId, userId, type: 'fuel' }).sort({ date: 1 });
  const segments = [];
  let start = null;
  let liters = 0;

  for (const exp of expenses) {
    if (!start) {
      if (exp.isFullFill) start = exp;
      continue;
    }

    liters += exp.liters || 0;

    if (exp.isFullFill) {
      const km = exp.km - start.km;
      if (km > 0) {
        segments.push({
          startDate: start.date,
          endDate: exp.date,
          km,
          liters,
          consumption: parseFloat(((liters / km) * 100).toFixed(2)),
        });
      }
      start = exp;
      liters = 0;
    }
  }
  return segments;
}

module.exports = { getConsumptionSegments };
