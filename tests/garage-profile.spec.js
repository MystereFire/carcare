const { test, expect, mockApi, token, vehicleId } = require('./support/mocked-api');

test('créer un véhicule envoie ses informations et sa photo en multipart', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/add-vehicle');
  await page.getByLabel('Nom du véhicule').fill('Mon Partner');
  await page.getByLabel('Marque').fill('Peugeot');
  await page.getByLabel('Modèle').fill('Partner');
  await page.getByLabel('Année').fill('2020');
  await page.getByLabel('Kilométrage initial (km)').fill('50000');
  await page.getByLabel('Réservoir (L)', { exact: true }).fill('55');
  await page.getByLabel('Photo du véhicule').setInputFiles({
    name: 'vehicle.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByAltText('Aperçu du véhicule')).toBeVisible();
  await page.getByRole('button', { name: 'Ajouter le véhicule', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicle\/veh2$/);
  await expect(page.getByRole('heading', { name: 'Mon Partner', exact: true })).toBeVisible();
  const request = state.requests.find(item => item.method === 'POST' && item.path === '/api/vehicles');
  expect(request.contentType).toContain('multipart/form-data; boundary=');
  expect(request.data).toMatchObject({ name: 'Mon Partner', brand: 'Peugeot', model: 'Partner',
    year: '2020', initialKm: '50000', tankSize: '55', image: { name: 'vehicle.png', type: 'image/png' } });
  expect(state.vehicles[1].currentOdometer).toBe(50000);
});

test('modifier un véhicule réutilise le formulaire sans perdre son compteur', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/edit`);
  await expect(page.getByLabel('Nom du véhicule')).toHaveValue('Ma Clio');
  await page.getByLabel('Nom du véhicule').fill('Clio familiale');
  await page.getByLabel('Immatriculation', { exact: true }).fill('EF-456-GH');
  await page.getByRole('button', { name: 'Enregistrer les modifications', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}$`));
  await expect(page.getByRole('heading', { name: 'Clio familiale', exact: true })).toBeVisible();
  expect(state.vehicles[0]).toMatchObject({ name: 'Clio familiale', plate: 'EF-456-GH', currentOdometer: 19000 });
  const request = state.requests.find(item => item.method === 'PUT' && item.path === `/api/vehicles/${vehicleId}`);
  expect(request.contentType).toContain('multipart/form-data; boundary=');
  expect(request.data).not.toHaveProperty('currentOdometer');
});

test('la comparaison distingue les données absentes puis les véhicules comparables', async ({ page }) => {
  const state = await mockApi(page);
  state.vehicles.push({ ...state.vehicles[0], _id: 'veh2', name: 'Mon Partner', initialKm: 50000, currentOdometer: 50000 });
  await page.goto('/compare');
  const selects = page.getByRole('combobox');
  await selects.nth(0).selectOption(vehicleId);
  await selects.nth(1).selectOption('veh2');
  const costSummary = page.getByRole('row').filter({ hasText: 'Coût/km' });
  await expect(costSummary).toContainText('Données insuffisantes');
  await expect(page.getByText(/plus économique/)).toHaveCount(0);

  state.vehicles[1].currentOdometer = 51000;
  state.expenses.push({ _id: 'exp4', vehicleId: 'veh2', type: 'fuel', label: 'Plein Partner', amount: 80,
    date: '2026-11-15', km: 51000, liters: 50, isFullFill: true });
  state.segments.veh2 = [{ date: '2026-11-15', km: 1000, liters: 50, consumption: 5, isSuspect: false }];
  await selects.nth(1).selectOption('');
  await selects.nth(1).selectOption('veh2');
  await expect(costSummary).toContainText('Ma Clio');
  await expect(page.getByRole('row').filter({ hasText: 'Consommation' })).toContainText('Mon Partner');
  await expect(page.getByText(/Ma Clio plus économique/)).toBeVisible();
});

test('un ancien mot de passe refusé conserve la connexion au compte', async ({ page }) => {
  const state = await mockApi(page);
  state.failures['PUT /api/auth/password'] = { status: 400, error: 'Mot de passe actuel incorrect' };
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Camille', exact: true })).toBeVisible();
  await page.getByLabel('Mot de passe actuel', { exact: true }).fill('wrong-password');
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('new-password-123');
  await page.getByLabel('Confirmez le nouveau mot de passe', { exact: true }).fill('new-password-123');
  await page.getByRole('button', { name: 'Mettre à jour le mot de passe', exact: true }).click();
  await expect(page.getByText('Mot de passe actuel incorrect', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(token);
  await expect(page.getByLabel('Nouveau mot de passe', { exact: true })).toHaveValue('new-password-123');
});
