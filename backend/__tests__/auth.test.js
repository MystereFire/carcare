const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const authRoutes = require('../routes/auth');
const User = require('../models/User');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

test('PUT /api/auth/password changes password', async () => {
  const passwordHash = await require('bcryptjs').hash('old', 10);
  const user = await User.create({ email: 'a@a.com', passwordHash, name: 'A' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const res = await request(app)
    .put('/api/auth/password')
    .set('Authorization', `Bearer ${token}`)
    .send({ currentPassword: 'old', newPassword: 'newpass' });

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('Mot de passe modifié');
  const updated = await User.findById(user._id);
  const match = await require('bcryptjs').compare('newpass', updated.passwordHash);
  expect(match).toBe(true);
});

test('PUT /api/auth/password with wrong current password returns 401', async () => {
  const passwordHash = await require('bcryptjs').hash('old', 10);
  const user = await User.create({ email: 'a@a.com', passwordHash, name: 'A' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const res = await request(app)
    .put('/api/auth/password')
    .set('Authorization', `Bearer ${token}`)
    .send({ currentPassword: 'bad', newPassword: 'newpass' });

  expect(res.status).toBe(401);
});

test('PUT /api/auth/password without token returns 401', async () => {
  const res = await request(app)
    .put('/api/auth/password')
    .send({ currentPassword: 'old', newPassword: 'newpass' });

  expect(res.status).toBe(401);
});
