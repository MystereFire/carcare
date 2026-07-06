const Expense = require('../models/Expense');

const MIN_PLAUSIBLE_CONSUMPTION = 2.5; // L/100km
const MAX_PLAUSIBLE_CONSUMPTION = 30; // L/100km

function computeMedian(sortedValues) {
  if (!sortedValues.length) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2) {
    return sortedValues[mid];
  }
  return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

function computeRobustStats(values) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) {
    return { median: 0, mad: 0 };
  }
  const sorted = [...finite].sort((a, b) => a - b);
  const median = computeMedian(sorted);
  const absoluteDeviations = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const rawMad = computeMedian(absoluteDeviations);
  // Consistent estimator for std dev assuming normal distribution
  const mad = rawMad * 1.4826;
  return { median, mad };
}

function detectSegmentIssues(segments) {
  if (!segments.length) return;
  const consumptions = segments.map((seg) => seg.consumption);
  const { median, mad } = computeRobustStats(consumptions);
  const enableRobustCheck = segments.length >= 3 && mad > 0;

  for (const seg of segments) {
    const issues = [];
    if (!Number.isFinite(seg.consumption) || seg.consumption <= 0) {
      issues.push('consumption_invalid');
    }
    if (!Number.isFinite(seg.km) || seg.km <= 0) {
      issues.push('distance_invalid');
    }
    if (!Number.isFinite(seg.liters) || seg.liters <= 0) {
      issues.push('fuel_missing');
    }

    if (Number.isFinite(seg.consumption)) {
      if (seg.consumption < MIN_PLAUSIBLE_CONSUMPTION) {
        issues.push('consumption_too_low');
      }
      if (seg.consumption > MAX_PLAUSIBLE_CONSUMPTION) {
        issues.push('consumption_too_high');
      }

      if (enableRobustCheck) {
        const deviation = Math.abs(seg.consumption - median);
        if (deviation > mad * 3) {
          issues.push('consumption_outlier');
        }
      } else if (median > 0) {
        const deviationRatio = Math.abs(seg.consumption - median) / median;
        if (deviationRatio > 0.5) {
          issues.push('consumption_outlier');
        }
      }
    }

    seg.isSuspect = issues.length > 0;
    seg.issues = issues;
    seg.medianConsumption = Number.isFinite(median) ? parseFloat(median.toFixed(2)) : null;
  }
}

function computeRollingAverages(segments) {
  for (let i = 0; i < segments.length; i++) {
    const window = segments.slice(Math.max(0, i - 2), i + 1).filter((seg) => !seg.isSuspect);
    if (!window.length) {
      segments[i].avgConsumption = null;
      segments[i].avgCostPer100 = null;
      continue;
    }
    const avgCons = window.reduce((sum, seg) => sum + seg.consumption, 0) / window.length;
    const avgCost = window.reduce((sum, seg) => sum + seg.costPer100, 0) / window.length;
    segments[i].avgConsumption = parseFloat(avgCons.toFixed(2));
    segments[i].avgCostPer100 = parseFloat(avgCost.toFixed(2));
  }
}

async function getConsumptionSegments(vehicleId, userId) {
  const expenses = await Expense.findAll({
    where: { vehicleId, userId, type: 'fuel' },
    order: [['date', 'ASC']]
  });

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

  detectSegmentIssues(segments);
  computeRollingAverages(segments);

  return segments;
}

module.exports = { getConsumptionSegments };
