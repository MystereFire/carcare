const { test, expect } = require('@playwright/test');

const vehicleId = 'veh1';

const sampleTasks = [
  { _id: '1', title: 'Vidange', status: 'DUE', intervalKm: 10000, intervalDays: 365, nextAtKm: 20000, nextAtDate: '2024-01-01' },
  { _id: '2', title: 'Filtre', status: 'OK', intervalKm: 15000, intervalDays: null, nextAtKm: 25000, nextAtDate: null },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/vehicles/' + vehicleId, route => {
    route.fulfill({ json: { _id: vehicleId, currentOdometer: 19000 } });
  });
  await page.route('**/api/maintenance/' + vehicleId, route => {
    route.fulfill({ json: sampleTasks });
  });
});

test('affichage liste et badges', async ({ page }) => {
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await expect(page.getByText('Vidange')).toBeVisible();
  await expect(page.getByText('DUE')).toBeVisible();
});

test('creation de tache', async ({ page }) => {
  await page.route('**/api/maintenance/' + vehicleId, route => {
    if (route.request().method() === 'POST') {
      sampleTasks.push({ _id: '3', title: 'Courroie', status: 'OK' });
      route.fulfill({ json: { _id: '3', title: 'Courroie', status: 'OK' } });
    } else {
      route.fulfill({ json: sampleTasks });
    }
  }, { times: 2 });
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await page.getByText('Nouvelle tâche').click();
  await page.getByLabel('Titre*').fill('Courroie');
  await page.getByLabel('Interval Km').fill('5000');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Courroie')).toBeVisible();
});

test('marquer comme fait', async ({ page }) => {
  await page.route('**/api/maintenance/1/complete', route => {
    sampleTasks[0].status = 'OK';
    route.fulfill({ json: sampleTasks[0] });
  });
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await page.getByText('Marquer comme fait').first().click();
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText('OK').first()).toBeVisible();
});

test('filtre DUE', async ({ page }) => {
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await page.selectOption('select', 'DUE');
  await expect(page.getByText('Vidange')).toBeVisible();
  await expect(page.getByText('Filtre')).not.toBeVisible();
});
