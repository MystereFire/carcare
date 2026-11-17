process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const { sequelize, User, Vehicle, Expense, MaintenanceTask } = require('../models');
const jwt = require('jsonwebtoken');

const vehicleRoutes = require('../routes/vehicle');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await sequelize.sync({ force: true });

  app = express();
  app.use(express.json());
  app.use('/api/vehicles', vehicleRoutes);
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await Expense.destroy({ where: {} });
  await MaintenanceTask.destroy({ where: {} });
  await Vehicle.destroy({ where: {} });
  await User.destroy({ where: {} });
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
  const res = await request(app)
    .get('/api/vehicles')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.page).toBe(1);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].name).toBe('Car A');
});

it('supports pagination for vehicles', async () => {
  const user = await User.create({ email: 'f@f.com', passwordHash: 'p', name: 'F' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  // create 15 vehicles
  const vehicles = [];
  for (let i = 0; i < 15; i++) {
    vehicles.push({
      userId: user._id,
      name: `Car ${i}`,
      createdAt: new Date(2000, 0, i + 1),
    });
  }
  await Vehicle.bulkCreate(vehicles);

  const res = await request(app)
    .get('/api/vehicles?page=2&limit=10')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.page).toBe(2);
  expect(res.body.totalPages).toBe(2);
  expect(res.body.data.length).toBe(5);
  // In Sequelize, order of bulkCreated records with dates on SQLite might vary.
  // The original mongoose test expected 'Car 4' at page 2, limit 10 (which is offset 10).
  // Mongoose ordered by createdAt DESC: Car 14, Car 13, ..., Car 5, Car 4...
  // So the 11th record (index 10) is indeed 'Car 4'.
  // Let's verify our query sort order in route is order: [['createdAt', 'DESC']].
  // Let's check if the name matches.
  expect(res.body.data[0].name).toBe('Car 4');
});

it('POST /api/vehicles creates a vehicle for the user', async () => {
  const user = await User.create({ email: 'c@c.com', passwordHash: 'z', name: 'C' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'New Car', tankSize: 50 });

  expect(res.status).toBe(201);
  expect(res.body.userId).toBe(String(user._id));
  expect(res.body.name).toBe('New Car');
  expect(res.body.tankSize).toBe(50);

  const count = await Vehicle.count({ where: { userId: user._id } });
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

it('DELETE /api/vehicles/:id removes vehicle and related data', async () => {
  const user = await User.create({ email: 'delete@test.com', passwordHash: 'pwd', name: 'Delete' });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const vehicle = await Vehicle.create({
    userId: user._id,
    name: 'To Remove',
    image: '/uploads/sample.jpg',
  });

  await Expense.create({
    userId: user._id,
    vehicleId: vehicle._id,
    type: 'fuel',
    label: 'Fuel up',
    amount: 42,
    date: new Date(),
  });

  await MaintenanceTask.create({
    userId: user._id,
    vehicleId: vehicle._id,
    title: 'Oil change',
  });

  const res = await request(app)
    .delete(`/api/vehicles/${vehicle._id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('Vehicule supprime');

  const vehicleCount = await Vehicle.count({ where: { userId: user._id } });
  const expenseCount = await Expense.count({ where: { userId: user._id, vehicleId: vehicle._id } });
  const maintenanceCount = await MaintenanceTask.count({ where: { userId: user._id, vehicleId: vehicle._id } });

  expect(vehicleCount).toBe(0);
  expect(expenseCount).toBe(0);
  expect(maintenanceCount).toBe(0);
});
