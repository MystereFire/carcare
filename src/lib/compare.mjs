export function computeBest(values, mode = 'min') {
  if (!Array.isArray(values) || values.length === 0) return null;
  const nums = values.map(v => (typeof v === 'number' && Number.isFinite(v) ? v : null));
  if (nums.includes(null)) return null;
  let bestIndex = 0;
  for (let i = 1; i < nums.length; i++) {
    if (mode === 'min') {
      if (nums[i] < nums[bestIndex]) bestIndex = i;
    } else {
      if (nums[i] > nums[bestIndex]) bestIndex = i;
    }
  }
  const allEqual = nums.every(v => v === nums[0]);
  return allEqual ? null : bestIndex;
}

export function computeDiff(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const maxVal = Math.max(Math.abs(a), Math.abs(b));
  if (maxVal === 0) return 0;
  return Math.abs(a - b) / maxVal * 100;
}

export function vehicleMetrics({ vehicle, expenses = [], segments = [] }) {
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const readings = expenses.filter(e => e.km != null && Number.isFinite(Number(e.km))).map(e => Number(e.km));
  const initial = vehicle.initialKm == null ? null : Number(vehicle.initialKm);
  const start = Number.isFinite(initial) ? initial : (readings.length ? Math.min(...readings) : null);
  const current = vehicle.currentOdometer == null ? null : Number(vehicle.currentOdometer);
  const end = Math.max(Number.isFinite(current) ? current : 0, ...readings);
  const distanceKm = start != null ? Math.max(0, end - start) : 0;
  const reliable = segments.filter(s => !s.isSuspect && Number(s.km) > 0 && Number(s.liters) > 0);
  const segmentKm = reliable.reduce((sum, s) => sum + Number(s.km), 0);
  const segmentLiters = reliable.reduce((sum, s) => sum + Number(s.liters), 0);
  return {
    id: vehicle._id, name: vehicle.name || `${vehicle.brand} ${vehicle.model}`,
    brand: vehicle.brand, model: vehicle.model, year: vehicle.year, photoUrl: vehicle.image,
    totals: {
      spendEUR: totalExpense, distanceKm,
      fuelL100: segmentKm > 0 ? segmentLiters / segmentKm * 100 : null,
      costPerKm: distanceKm > 0 && expenses.length > 0 ? totalExpense / distanceKm : null,
    },
  };
}
