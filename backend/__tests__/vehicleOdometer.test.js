const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const expenseRoutes = require('../routes/expense');
const vehicleRoutes = require('../routes/vehicle');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/vehicles', vehicleRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Vehicle.deleteMany({});
});

test('vehicle currentOdometer updates after expense', async () => {
  const user = await User.create({ email: 'a@a.com', passwordHash: 'x', name: 'A' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car', initialKm: 1000, currentOdometer: 1000 });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const expRes = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${token}`)
    .send({ vehicleId: vehicle._id, type: 'fuel', amount: 10, date: new Date(), km: 1500 });
  expect(expRes.status).toBe(201);

  const vehRes = await request(app)
    .get(`/api/vehicles/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(vehRes.status).toBe(200);
  expect(vehRes.body.currentOdometer).toBe(1500);
});
