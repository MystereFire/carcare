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

test('compute consumption statistics between consecutive fuel entries', async () => {
  const user = await User.create({ email: 'test@test.com', passwordHash: 'hash', name: 'T' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  await Expense.insertMany([
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10000, liters: 50, amount: 80, date: new Date('2024-01-01') },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10100, liters: 8, amount: 16, date: new Date('2024-01-05') },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10250, liters: 10, amount: 20, date: new Date('2024-01-10') },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10500, liters: 30, amount: 60, date: new Date('2024-01-20') },
  ]);

  const res = await request(app)
    .get(`/api/stats/vehicle/${vehicle._id}/consumption`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(3);

  expect(res.body[0].km).toBe(100);
  expect(res.body[0].consumption).toBeCloseTo(8.0, 2);
  expect(res.body[0].costPer100).toBeCloseTo(16.0, 2);
  expect(res.body[0].avgConsumption).toBeCloseTo(8.0, 2);

  expect(res.body[1].km).toBe(150);
  expect(res.body[1].consumption).toBeCloseTo(6.67, 2);
  expect(res.body[1].avgConsumption).toBeCloseTo(7.33, 2);

  expect(res.body[2].km).toBe(250);
  expect(res.body[2].consumption).toBeCloseTo(12.0, 2);
  expect(res.body[2].avgConsumption).toBeCloseTo(8.89, 2);
});
