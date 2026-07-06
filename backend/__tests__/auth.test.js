process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../models');
const jwt = require('jsonwebtoken');

const authRoutes = require('../routes/auth');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await sequelize.sync({ force: true });

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await User.destroy({ where: {} });
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
  const updated = await User.findByPk(user._id);
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
