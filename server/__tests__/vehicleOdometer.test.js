process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const { sequelize, User, Vehicle } = require('../models');
const jwt = require('jsonwebtoken');

const expenseRoutes = require('../routes/expense');
const vehicleRoutes = require('../routes/vehicle');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await sequelize.sync({ force: true });

  app = express();
  app.use(express.json());
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/vehicles', vehicleRoutes);
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await Vehicle.destroy({ where: {} });
  await User.destroy({ where: {} });
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

test('vehicle currentOdometer can be manually updated', async () => {
  const user = await User.create({ email: 'b@b.com', passwordHash: 'y', name: 'B' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car', initialKm: 2000, currentOdometer: 2000 });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const updateRes = await request(app)
    .put(`/api/vehicles/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ currentOdometer: 2500 });

  expect(updateRes.status).toBe(200);
  expect(updateRes.body.currentOdometer).toBe(2500);
});
