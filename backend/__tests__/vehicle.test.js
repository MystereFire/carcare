const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

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

// Test if unauthenticated request is rejected
it('GET /api/vehicles without token returns 401', async () => {
  const res = await request(app).get('/api/vehicles');
  expect(res.status).toBe(401);
});

it('GET /api/vehicles returns only user\'s vehicles', async () => {
  const user1 = await User.create({ email: 'a@a.com', passwordHash: 'x', name: 'A' });
  const user2 = await User.create({ email: 'b@b.com', passwordHash: 'y', name: 'B' });
  await Vehicle.create({ userId: user1._id, name: 'Car A' });
  await Vehicle.create({ userId: user2._id, name: 'Car B' });

  const token = jwt.sign({ _id: user1._id }, process.env.JWT_SECRET);
  const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(1);
  expect(res.body[0].name).toBe('Car A');
});

it('POST /api/vehicles creates a vehicle for the user', async () => {
  const user = await User.create({ email: 'c@c.com', passwordHash: 'z', name: 'C' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'New Car' });

  expect(res.status).toBe(201);
  expect(res.body.userId).toBe(String(user._id));
  expect(res.body.name).toBe('New Car');

  const count = await Vehicle.countDocuments({ userId: user._id });
  expect(count).toBe(1);
});

it('GET /api/vehicles/:id forbids access to other user\'s vehicle', async () => {
  const user1 = await User.create({ email: 'd@d.com', passwordHash: 'a', name: 'D' });
  const user2 = await User.create({ email: 'e@e.com', passwordHash: 'b', name: 'E' });
  const vehicle = await Vehicle.create({ userId: user1._id, name: 'Secret Car' });
  const token = jwt.sign({ _id: user2._id }, process.env.JWT_SECRET);

  const res = await request(app)
    .get(`/api/vehicles/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(404);
});
