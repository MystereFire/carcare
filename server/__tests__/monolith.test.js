process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.GOOGLE_CLIENT_ID = '';
process.env.GOOGLE_CLIENT_SECRET = '';

const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { app } = require('../server');
const { sequelize } = require('../models');
const { attachProductionFrontend } = require('../services/frontendService');
let directory;

beforeAll(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'carcare-monolith-'));
  fs.writeFileSync(path.join(directory, 'index.html'), '<!doctype html><html><body><div id="root">CarCare</div></body></html>');
  fs.writeFileSync(path.join(directory, 'app.js'), 'window.carcare = true;');
  attachProductionFrontend(app, directory);
  app.use((req, res) => res.status(404).json({ error: 'Ressource introuvable' }));
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  fs.unlinkSync(path.join(directory, 'index.html'));
  fs.unlinkSync(path.join(directory, 'app.js'));
  fs.rmdirSync(directory);
  await sequelize.close();
});

test('direct navigation to a React route serves the compiled app', async () => {
  const res = await request(app).get('/vehicle/car-123').set('Accept', 'text/html');
  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toMatch(/text\/html/);
  expect(res.text).toContain('id="root"');
});

test('compiled static assets are served by the same Express server', async () => {
  const res = await request(app).get('/app.js');
  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toMatch(/javascript/);
});

test.each(['/api/does-not-exist', '/uploads/does-not-exist.png'])('missing service resources return JSON instead of the app shell: %s', async route => {
  const res = await request(app).get(route).set('Accept', 'text/html');
  expect(res.status).toBe(404);
  expect(res.headers['content-type']).toMatch(/application\/json/);
  expect(res.body.error).toBeTruthy();
});

test('missing JavaScript assets retain their 404 status', async () => {
  expect((await request(app).get('/missing-script.js')).status).toBe(404);
});

test('API authentication and health checks work alongside the app shell', async () => {
  expect((await request(app).get('/api/vehicles')).status).toBe(401);
  const health = await request(app).get('/health');
  expect(health.status).toBe(200);
  expect(health.body.db).toBe('ok');
  expect((await request(app).get('/api/auth/google')).status).toBe(503);
});
