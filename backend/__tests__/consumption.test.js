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

test('compute full-to-full consumption segments', async () => {
  const user = await User.create({ email: 'test@test.com', passwordHash: 'hash', name: 'T' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  await Expense.insertMany([
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10000, liters: 50, isFullFill: true, date: new Date('2024-01-01') },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10200, liters: 10, isFullFill: false, date: new Date('2024-01-10') },
    { userId: user._id, vehicleId: vehicle._id, type: 'fuel', km: 10450, liters: 45, isFullFill: true, date: new Date('2024-01-20') },
  ]);

  const res = await request(app)
    .get(`/api/stats/vehicle/${vehicle._id}/consumption`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].km).toBe(450);
  expect(res.body[0].liters).toBe(55);
  expect(res.body[0].consumption).toBeCloseTo(12.22, 2);
});
