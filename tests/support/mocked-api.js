const { test: base, expect } = require('@playwright/test');

// Also detect exceptions that would otherwise leave a blank React page.
const test = base.extend({
  browserErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
    expect(errors, 'Exceptions JavaScript dans la page').toEqual([]);
  }, { auto: true }],
});

const vehicleId = 'veh1';
const token = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ _id: 'user1', exp: 4102444800 })).toString('base64url'),
  'mock-signature',
].join('.');

function fixtures() {
  return {
    vehicles: [{
      _id: vehicleId, name: 'Ma Clio', brand: 'Renault', model: 'Clio',
      year: 2021, plate: 'AB-123-CD', initialKm: 10000,
      currentOdometer: 19000, tankSize: 45, fuelType: 'essence',
      technicalInspectionDate: '2027-11-17', image: null,
    }],
    expenses: [
      { _id: 'exp1', vehicleId, type: 'fuel', label: 'Plein de départ', amount: 72,
        date: '2026-11-01', km: 18000, liters: 40, isFullFill: true, notes: '' },
      { _id: 'exp2', vehicleId, type: 'fuel', label: 'Plein du trajet', amount: 63,
        date: '2026-11-10', km: 18500, liters: 35, isFullFill: true, notes: '' },
      { _id: 'exp3', vehicleId, type: 'repair', label: 'Réparation du rétroviseur', amount: 120,
        date: '2026-11-12', km: 18800, liters: null, isFullFill: false, notes: '' },
    ],
    tasks: [
      { _id: 'task1', vehicleId, title: 'Vidange', status: 'DUE', intervalKm: 10000,
        intervalDays: 365, lastDoneKm: 8000, lastDoneDate: '2025-01-01',
        nextAtKm: 18000, nextAtDate: '2026-01-01', isInspection: false },
      { _id: 'task2', vehicleId, title: 'Filtre habitacle', status: 'OK',
        intervalKm: 15000, intervalDays: null, lastDoneKm: 10000,
        nextAtKm: 25000, nextAtDate: null, isInspection: false },
    ],
    segments: { [vehicleId]: [{ date: '2026-11-10', km: 500, liters: 35,
      consumption: 7, costPer100: 12.6, isSuspect: false, issues: [] }] },
    requests: [], failures: {},
  };
}

async function mockApi(page, { authenticated = true, emptyGarage = false } = {}) {
  // Fixture dates stay deterministic while browser timers continue normally.
  await page.clock.setFixedTime(new Date('2026-11-17T11:00:00Z'));
  const state = fixtures();
  if (emptyGarage) state.vehicles = [];
  await page.addInitScript(({ authenticated, token, vehicleId }) => {
    // A full navigation must preserve changes made by the application, including
    // session expiration. Each test already has its own browser context.
    if (sessionStorage.getItem('carcare-test-initialized')) return;
    localStorage.clear(); sessionStorage.clear();
    sessionStorage.setItem('carcare-test-initialized', 'true');
    if (authenticated) {
      localStorage.setItem('token', token);
      localStorage.setItem('currentVehicleId', vehicleId);
    }
  }, { authenticated, token, vehicleId });

  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const contentType = request.headers()['content-type'] || '';
    let data = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (contentType.includes('multipart/form-data')) {
        const form = await new Request(request.url(), {
          method, headers: { 'content-type': contentType }, body: request.postDataBuffer(),
        }).formData();
        data = Object.fromEntries([...form].map(([key, value]) => [key,
          typeof value === 'string' ? value : { name: value.name, type: value.type, size: value.size }]));
      } else data = request.postDataJSON() || {};
    }
    state.requests.push({ method, path, data, contentType });
    const reply = (json, status = 200) => route.fulfill({ status, json });
    const failure = state.failures[`${method} ${path}`];
    if (failure) return reply({ error: failure.error || 'Service indisponible' }, failure.status || 500);
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    if (path === '/api/auth/login') return reply({ token });
    if (path === '/api/auth/register') return reply({ message: 'Compte créé' }, 201);
    if (path === '/api/auth/me') return reply({ _id: 'user1', name: 'Camille', email: 'camille@example.com', provider: 'local' });
    if (path === '/api/auth/password' && method === 'PUT') return reply({ message: 'Mot de passe modifié' });

    if (path === '/api/vehicles' && method === 'GET') {
      const pageNumber = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 100);
      return reply({ page: pageNumber, totalPages: Math.max(1, Math.ceil(state.vehicles.length / limit)),
        total: state.vehicles.length, data: state.vehicles.slice((pageNumber - 1) * limit, pageNumber * limit) });
    }
    if (path === '/api/vehicles' && method === 'POST') {
      const vehicle = { ...data, _id: `veh${state.vehicles.length + 1}`,
        year: Number(data.year), initialKm: Number(data.initialKm), currentOdometer: Number(data.initialKm),
        tankSize: data.tankSize ? Number(data.tankSize) : null, image: data.image ? '/car-placeholder.svg' : null };
      state.vehicles.push(vehicle);
      return reply(vehicle, 201);
    }
    if (path.startsWith('/api/vehicles/')) {
      const vehicle = state.vehicles.find(item => item._id === path.split('/')[3]);
      if (!vehicle) return reply({ error: 'Véhicule introuvable' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        Object.assign(vehicle, data, data.image ? { image: '/car-placeholder.svg' } : {});
        for (const key of ['year', 'initialKm', 'currentOdometer', 'tankSize']) {
          if (vehicle[key] !== '' && vehicle[key] != null) vehicle[key] = Number(vehicle[key]);
        }
      }
      return reply(vehicle);
    }

    if (path === '/api/expenses' && method === 'POST') {
      const expense = { ...data, _id: `exp${state.expenses.length + 1}` };
      state.expenses.push(expense);
      return reply(expense, 201);
    }
    if (path === '/api/expenses' && method === 'GET') {
      return reply(state.expenses.filter(item => item.vehicleId === url.searchParams.get('vehicleId')));
    }
    if (path.startsWith('/api/expenses/') && method === 'GET') {
      const pageNumber = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 20);
      const id = url.searchParams.get('vehicleId') || path.split('/')[3];
      const all = state.expenses.filter(item => item.vehicleId === id);
      return reply({ page: pageNumber, totalPages: Math.max(1, Math.ceil(all.length / limit)),
        total: all.length, data: all.slice((pageNumber - 1) * limit, pageNumber * limit) });
    }
    if (path.startsWith('/api/expenses/') && method === 'DELETE') {
      state.expenses = state.expenses.filter(item => item._id !== path.split('/')[3]);
      return reply({ message: 'Dépense supprimée' });
    }
    if (path.startsWith('/api/expenses/') && method === 'PUT') {
      const expense = state.expenses.find(item => item._id === path.split('/')[3]);
      if (!expense) return reply({ error: 'Dépense introuvable' }, 404);
      Object.assign(expense, data);
      return reply(expense);
    }

    if (/^\/api\/maintenance\/[^/]+$/.test(path) && method === 'GET') {
      return reply(state.tasks.filter(item => item.vehicleId === path.split('/')[3]));
    }
    if (path === `/api/maintenance/${vehicleId}`) {
      if (method === 'POST') {
        const task = { ...data, _id: `task${state.tasks.length + 1}`, vehicleId, status: 'OK' };
        state.tasks.push(task);
        return reply(task, 201);
      }
    }
    if (/^\/api\/maintenance\/[^/]+\/complete$/.test(path)) {
      const task = state.tasks.find(item => item._id === path.split('/')[3]);
      if (!task) return reply({ error: 'Tâche introuvable' }, 404);
      Object.assign(task, { status: 'OK', lastDoneKm: Number(data.doneKm), lastDoneDate: data.doneDate,
        nextAtKm: Number(data.doneKm) + Number(task.intervalKm || 0), nextAtDate: '2027-11-17' });
      return reply(task);
    }
    if (path.startsWith('/api/maintenance/') && method === 'DELETE') {
      state.tasks = state.tasks.filter(item => item._id !== path.split('/')[3]);
      return reply({ message: 'Tâche supprimée' });
    }
    if (/^\/api\/stats\/vehicle\/[^/]+\/consumption$/.test(path)) {
      return reply(state.segments[path.split('/')[4]] || []);
    }
    if (path.startsWith('/api/stats/dashboard/')) {
      return reply({ vehicle: state.vehicles[0], maintenance: state.tasks[0],
        kpis: { last90Days: { totalAmount: 255, totalLiters: 35, totalKm: 500, costPer100Km: 51, litersPer100Km: 7 } },
        distribution: { annualByType: [{ type: 'fuel', total: 135 }, { type: 'repair', total: 120 }] },
        evolution: { monthly: [{ month: '2026-11', total: 255 }] }, recentExpenses: state.expenses });
    }
    return reply({ error: `Route non simulée : ${method} ${path}` }, 404);
  });
  return state;
}

module.exports = { test, expect, mockApi, token, vehicleId };
