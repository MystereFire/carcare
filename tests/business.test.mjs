import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBest, computeDiff, vehicleMetrics } from '../src/lib/compare.mjs';
import { expensePayload, imageFileError, vehicleFormData, emptyVehicle } from '../src/lib/forms.mjs';
import { localDateInput, remainingDays } from '../src/lib/dates.mjs';
import { formatDate, formatEuro, formatKm, formatL100, computeDomain } from '../src/lib/formatters.mjs';

test('comparison never rewards missing or non-finite measurements', () => {
  assert.equal(computeBest([null, 6]), null);
  assert.equal(computeBest([Infinity, 6]), null);
  assert.equal(computeBest([6, 6]), null);
  assert.equal(computeBest([7, 6]), 1);
  assert.equal(computeDiff(null, 6), null);
  assert.equal(computeDiff(5, 10), 50);
});

test('comparison uses numeric readings and weights full-tank segments by distance', () => {
  const metrics = vehicleMetrics({
    vehicle: { _id: 1, initialKm: '1000', currentOdometer: '2500' },
    expenses: [{ amount: '40.5', km: '1600' }, { amount: '59.5', km: '2500' }],
    segments: [{ km: 500, liters: 25 }, { km: 1000, liters: 70 }, { km: 2, liters: 100, isSuspect: true }],
  });
  assert.equal(metrics.totals.distanceKm, 1500);
  assert.equal(metrics.totals.spendEUR, 100);
  assert.equal(metrics.totals.fuelL100, 95 / 1500 * 100);
  assert.equal(metrics.totals.costPerKm, 100 / 1500);
  const empty = vehicleMetrics({ vehicle: { initialKm: 0, currentOdometer: 0 } });
  assert.equal(empty.totals.fuelL100, null);
  assert.equal(empty.totals.costPerKm, null);
});

const baseExpense = { type: 'fuel', label: ' Plein ', amount: '50.25', km: '0', date: '2026-11-17', liters: '25', isFullFill: true };
test('expense preserves zero odometer, normalizes numbers, and clears fuel on repairs', () => {
  assert.deepEqual(expensePayload(baseExpense), { type: 'fuel', label: 'Plein', amount: 50.25, km: 0, date: '2026-11-17', liters: 25, isFullFill: true, notes: '' });
  const repair = expensePayload({ ...baseExpense, type: 'repair' });
  assert.equal(repair.liters, null);
  assert.equal(repair.isFullFill, false);
});

test('invalid financial data and incomplete full fills are rejected', () => {
  for (const override of [{ amount: '' }, { amount: -1 }, { amount: 'Infinity' }, { km: -1 }, { km: 1.5 }, { date: '2026-02-30' }, { liters: '' }, { liters: -2 }, { label: '  ' }]) {
    assert.throws(() => expensePayload({ ...baseExpense, ...override }));
  }
});

test('vehicle form retains zero and optional empty fields; validates files', () => {
  const fields = { ...emptyVehicle, name: ' Ma voiture ', brand: 'Renault', model: 'Clio', year: 2020, initialKm: 0 };
  const data = vehicleFormData(fields, null);
  assert.equal(data.get('initialKm'), '0');
  assert.equal(data.get('name'), 'Ma voiture');
  assert.equal(data.get('tankSize'), '');
  assert.throws(() => vehicleFormData({ ...fields, tankSize: -1 }, null));
  assert.ok(imageFileError({ type: 'image/svg+xml', size: 10 }));
  assert.ok(imageFileError({ type: 'image/png', size: 6 * 1024 * 1024 }));
});

test('calendar helpers keep the local date and compare calendar days across DST', () => {
  assert.equal(localDateInput(new Date(2026, 10, 17, 0, 5)), '2026-11-17');
  assert.equal(remainingDays('2026-03-30', new Date(2026, 2, 28, 23, 50)), 2);
  assert.equal(remainingDays('2026-11-17', new Date(2026, 10, 17, 23)), 0);
  assert.equal(remainingDays(null), null);
});

test('display helpers distinguish missing values from zero without throwing', () => {
  assert.equal(formatDate('invalid'), '—');
  assert.equal(formatEuro(null), '—');
  assert.equal(formatL100(null), '—');
  assert.equal(formatKm(0), '0 km');
  assert.deepEqual(computeDomain([null, Infinity, 10]), [9, 11]);
});
