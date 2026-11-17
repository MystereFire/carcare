process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sequelize, User, Vehicle, Expense, MaintenanceTask } = require('../models');
const { computeNext } = require('../services/maintenanceService');
const { parseCsv } = require('../services/csvService');
const { getConsumptionSegments } = require('../services/consumptionService');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));
app.use('/api/vehicles', require('../routes/vehicle'));
app.use('/api/expenses', require('../routes/expense'));
app.use('/api/maintenance', require('../routes/maintenance'));
app.use('/api/stats', require('../routes/stats'));
app.use(require('../middleware/errorHandler'));

let user, outsider, vehicle, otherVehicle, token;
const authenticate = req => req.set('Authorization', `Bearer ${token}`);
const expenseBody = extra => ({ vehicleId: vehicle._id, type: 'fuel', amount: 60, km: 1500, liters: 30, date: '2024-01-01', ...extra });

beforeAll(async () => { await sequelize.sync({ force: true }); });
beforeEach(async () => {
  user = await User.create({ email: 'driver@example.com', name: 'Driver' });
  outsider = await User.create({ email: 'other@example.com', name: 'Other' });
  vehicle = await Vehicle.create({ userId: user._id, name: 'Car', currentOdometer: 1000 });
  otherVehicle = await Vehicle.create({ userId: outsider._id, name: 'Private car', currentOdometer: 3000 });
  token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
});
afterEach(async () => {
  await MaintenanceTask.destroy({ where: {} });
  await Expense.destroy({ where: {} });
  await Vehicle.destroy({ where: {} });
  await User.destroy({ where: {} });
});
afterAll(async () => { await sequelize.close(); });

test('cannot create or import expenses against another user’s vehicle', async () => {
  const create = await authenticate(request(app).post('/api/expenses')).send(expenseBody({ vehicleId: otherVehicle._id, km: 9000 }));
  const imported = await authenticate(request(app).post(`/api/expenses/vehicle/${otherVehicle._id}/import`)).send({ csvText: 'Date,Type,Label,Amount,Km,Liters,IsFullFill,Notes\n2024-01-01,fuel,Test,60,9000,30,true,' });
  expect(create.status).toBe(404);
  expect(imported.status).toBe(404);
  expect(await Expense.count()).toBe(0);
  expect((await otherVehicle.reload()).currentOdometer).toBe(3000);
});

test('cannot move an owned expense to another user’s vehicle', async () => {
  const expense = await Expense.create({ ...expenseBody({}), userId: user._id });
  const res = await authenticate(request(app).put(`/api/expenses/${expense._id}`)).send({ vehicleId: otherVehicle._id, km: 9000 });
  expect(res.status).toBe(404);
  expect((await expense.reload()).vehicleId).toBe(vehicle._id);
  expect((await otherVehicle.reload()).currentOdometer).toBe(3000);
});

test.each([{ amount: -1 }, { amount: '10x' }, { km: -1 }, { date: '2024-02-30' }, { type: 'other' }, { liters: 0 }, { isFullFill: true, km: null }, { isFullFill: 'perhaps' }])('rejects invalid expenses without changing data: %j', async extra => {
  const res = await authenticate(request(app).post('/api/expenses')).send(expenseBody(extra));
  expect(res.status).toBe(400);
  expect(await Expense.count()).toBe(0);
  expect((await vehicle.reload()).currentOdometer).toBe(1000);
});

test('CSV export and import preserve commas, quotes, newlines and zero values', async () => {
  const original = await Expense.create({ ...expenseBody({ type: 'repair', amount: 0, km: 0, liters: null, label: 'Révision, "atelier"', notes: 'Ligne 1\nLigne 2, détail' }), userId: user._id });
  const exported = await authenticate(request(app).get(`/api/expenses/vehicle/${vehicle._id}/export`));
  expect(exported.status).toBe(200);
  expect(parseCsv(exported.text)).toHaveLength(2);
  const imported = await authenticate(request(app).post(`/api/expenses/vehicle/${vehicle._id}/import`)).send({ csvText: exported.text });
  expect(imported.status).toBe(200);
  const rows = await Expense.findAll({ where: { vehicleId: vehicle._id } });
  const copy = rows.find(row => row._id !== original._id);
  expect(copy.label).toBe(original.label);
  expect(copy.notes).toBe(original.notes);
  expect(copy.amount).toBe(0);
  expect(copy.km).toBe(0);
});

test('invalid CSV row rolls back the entire import', async () => {
  const csvText = 'Date,Type,Label,Amount,Km,Liters,IsFullFill,Notes\n2024-01-01,fuel,Valid,60,1500,30,true,\n2024-01-02,fuel,Invalid,-1,2000,30,true,';
  const res = await authenticate(request(app).post(`/api/expenses/vehicle/${vehicle._id}/import`)).send({ csvText });
  expect(res.status).toBe(400);
  expect(await Expense.count()).toBe(0);
  expect((await vehicle.reload()).currentOdometer).toBe(1000);
});

test('monotonic odometer accepts zero initially and rejects a decrease or malformed values', async () => {
  for (const currentOdometer of [999, 'not-a-number', -1]) {
    const res = await authenticate(request(app).patch(`/api/vehicles/${vehicle._id}`)).send({ currentOdometer });
    expect(res.status).toBe(400);
  }
  const res = await authenticate(request(app).patch(`/api/vehicles/${vehicle._id}`)).send({ currentOdometer: 2000 });
  expect(res.body.currentOdometer).toBe(2000);
});

test.each(['page=-1', 'limit=-1', 'limit=100000', 'page=1.5'])('rejects invalid pagination: %s', async query => {
  expect((await authenticate(request(app).get(`/api/vehicles?${query}`))).status).toBe(400);
  expect((await authenticate(request(app).get(`/api/expenses/${vehicle._id}?${query}`))).status).toBe(400);
});

test('inspection deadline controls maintenance status and ignores stale intervals', async () => {
  const task = await MaintenanceTask.create({ userId: user._id, vehicleId: vehicle._id, title: 'CT', isInspection: true, inspectionDate: '2000-01-01', intervalKm: 9999, lastDoneKm: 1000 });
  const res = await authenticate(request(app).get(`/api/maintenance/${vehicle._id}`));
  expect(res.body[0].status).toBe('DUE');
  expect(res.body[0].nextAtKm).toBeNull();
  expect(res.body[0].nextAtDate.slice(0, 10)).toBe('2000-01-01');
  expect(task.status).toBe('DUE');
});

test('maintenance status refreshes after odometer advances without editing a task', async () => {
  await MaintenanceTask.create({ userId: user._id, vehicleId: vehicle._id, title: 'Vidange', intervalKm: 5000, lastDoneKm: 1000 });
  await vehicle.update({ currentOdometer: 7000 });
  const res = await authenticate(request(app).get(`/api/maintenance/${vehicle._id}`));
  expect(res.body[0].status).toBe('DUE');
});

test('removing an interval clears its previous computed deadline', () => {
  const result = computeNext({ intervalKm: null, lastDoneKm: 1000, nextAtKm: 2000, intervalDays: null, nextAtDate: new Date('2000-01-01') }, vehicle, 0);
  expect(result.nextAtKm).toBeNull();
  expect(result.nextAtDate).toBeNull();
  expect(result.status).toBe('OK');
});

test('completing maintenance updates the vehicle odometer and recomputes next service', async () => {
  const task = await MaintenanceTask.create({ userId: user._id, vehicleId: vehicle._id, title: 'Vidange', intervalKm: 5000, lastDoneKm: 1000 });
  const res = await authenticate(request(app).post(`/api/maintenance/${task._id}/complete`)).send({ doneKm: 8000, doneDate: '2024-01-01' });
  expect(res.status).toBe(200);
  expect(res.body.nextAtKm).toBe(13000);
  expect((await vehicle.reload()).currentOdometer).toBe(8000);
});

test('dashboard measures distance differences rather than summing odometers', async () => {
  const date = new Date();
  await Expense.bulkCreate([
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', date, km: 10000, liters: 40, amount: 80, isFullFill: true },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', date, km: 10500, liters: 30, amount: 60, isFullFill: true },
  ]);
  const res = await authenticate(request(app).get(`/api/stats/dashboard/${vehicle._id}`));
  expect(res.status).toBe(200);
  expect(res.body.kpis.last90Days.totalKm).toBe(500);
  expect(res.body.kpis.last90Days.litersPer100Km).toBe(6);
  expect(res.body.evolution.monthly).toHaveLength(12);
});

test('missing fuel data invalidates a full-to-full interval', async () => {
  await Expense.bulkCreate([
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', date: '2024-01-01', km: 1000, liters: 40, isFullFill: true },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', date: '2024-01-02', km: 1200, liters: null },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', date: '2024-01-03', km: 1500, liters: 30, isFullFill: true },
  ]);
  expect(await getConsumptionSegments(vehicle._id, user._id)).toEqual([]);
});

test('registration normalizes email and rejects equivalent duplicates', async () => {
  const first = await request(app).post('/api/auth/register').send({ email: ' New@Example.com ', password: 'password123', name: ' New ' });
  const second = await request(app).post('/api/auth/register').send({ email: 'new@example.com', password: 'password123', name: 'New' });
  expect(first.status).toBe(201);
  expect(second.status).toBe(409);
  expect((await request(app).post('/api/auth/login').send({ email: 'NEW@example.com', password: 'password123' })).status).toBe(200);
});

test('Google-only account password change returns a clean authentication failure', async () => {
  await user.update({ provider: 'google', passwordHash: null });
  const res = await authenticate(request(app).put('/api/auth/password')).send({ currentPassword: 'old', newPassword: 'password123' });
  expect(res.status).toBe(400);
});
