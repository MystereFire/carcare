process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const { sequelize, User, Vehicle, MaintenanceTask } = require('../models');
const jwt = require('jsonwebtoken');

const maintenanceRoutes = require('../routes/maintenance');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await sequelize.sync({ force: true });

  app = express();
  app.use(express.json());
  app.use('/api/maintenance', maintenanceRoutes);
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await MaintenanceTask.destroy({ where: {} });
  await Vehicle.destroy({ where: {} });
  await User.destroy({ where: {} });
});

test('creating and completing a maintenance task', async () => {
  const user = await User.create({ email: 'a@a.com', passwordHash: 'x', name: 'A' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car', currentOdometer: 10000 });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const createRes = await request(app)
    .post(`/api/maintenance/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Vidange',
      intervalKm: 5000,
      lastDoneKm: 10000,
    });
  expect(createRes.status).toBe(201);
  expect(createRes.body.nextAtKm).toBe(15000);
  expect(createRes.body.status).toBe('OK');

  const completeRes = await request(app)
    .post(`/api/maintenance/${createRes.body._id}/complete`)
    .set('Authorization', `Bearer ${token}`)
    .send({ doneKm: 15000, doneDate: new Date() });
  expect(completeRes.status).toBe(200);
  expect(completeRes.body.lastDoneKm).toBe(15000);
  expect(completeRes.body.nextAtKm).toBe(20000);
});
