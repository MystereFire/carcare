const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const statsRoutes = require('../routes/stats');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'testsecret';

  app = express();
  app.use(express.json());
  app.use('/api/stats', statsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Expense.deleteMany({});
  await Vehicle.deleteMany({});
  await User.deleteMany({});
});

test('compute consumption statistics between full fill-ups', async () => {
  const user = await User.create({ email: 'test@test.com', passwordHash: 'hash', name: 'T' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  await Expense.insertMany([
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10000, liters: 50, amount: 80, date: new Date('2024-01-01'), isFullFill: true },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10200, liters: 10, amount: 20, date: new Date('2024-01-05'), isFullFill: false },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10400, liters: 20, amount: 40, date: new Date('2024-01-10'), isFullFill: true },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10500, liters: 5, amount: 10, date: new Date('2024-01-15'), isFullFill: false },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10700, liters: 25, amount: 50, date: new Date('2024-01-20'), isFullFill: true },
  ]);

  const res = await request(app)
    .get(`/api/stats/vehicle/${vehicle._id}/consumption`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(2);

  // First segment: from 10000 to 10400, liters 10 + 20 = 30
  expect(res.body[0].km).toBe(400);
  expect(res.body[0].liters).toBe(30);
  expect(res.body[0].consumption).toBeCloseTo(7.5, 2);
  expect(res.body[0].costPer100).toBeCloseTo(15, 2);
  expect(res.body[0].avgConsumption).toBeCloseTo(7.5, 2);

  // Second segment: from 10400 to 10700, liters 5 + 25 = 30
  expect(res.body[1].km).toBe(300);
  expect(res.body[1].liters).toBe(30);
  expect(res.body[1].consumption).toBeCloseTo(10, 2);
  expect(res.body[1].avgConsumption).toBeCloseTo(8.75, 2);
});
