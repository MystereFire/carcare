const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const expenseRoutes = require('../routes/expense');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/expenses', expenseRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Expense.deleteMany({});
});

test('GET /api/expenses/:vehicleId without token should return 401', async () => {
  const res = await request(app).get('/api/expenses/someid');
  expect(res.status).toBe(401);
});

test('user cannot access expenses of another user', async () => {
  const user1 = await User.create({ email: 'a@a.com', passwordHash: 'x', name: 'A' });
  const user2 = await User.create({ email: 'b@b.com', passwordHash: 'y', name: 'B' });
  const vehicle = await Vehicle.create({ userId: user1._id, name: 'Car' });
  await Expense.create({
    userId: user1._id,
    vehicleId: vehicle._id,
    type: 'fuel',
    amount: 10,
  });

  const token = jwt.sign({ _id: user2._id }, process.env.JWT_SECRET);
  const res = await request(app)
    .get(`/api/expenses/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.length).toBe(0);
});

test('supports pagination for expenses', async () => {
  const user = await User.create({ email: 'c@c.com', passwordHash: 'x', name: 'C' });
  const vehicle = await Vehicle.create({ userId: user._id, name: 'Car' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const expenses = [];
  for (let i = 0; i < 15; i++) {
    expenses.push({ userId: user._id, vehicleId: vehicle._id, type: 'fuel', amount: i });
  }
  await Expense.insertMany(expenses);

  const res = await request(app)
    .get(`/api/expenses/${vehicle._id}?page=2&limit=10`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.page).toBe(2);
  expect(res.body.totalPages).toBe(2);
  expect(res.body.data.length).toBe(5);
  expect(res.body.data[0].amount).toBe(10);
});
