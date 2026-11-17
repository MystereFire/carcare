const { test, expect, mockApi, vehicleId } = require('./support/mocked-api');

test('le tableau de bord charge le véhicule et ses dépenses', async ({ page }) => {
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}`);
  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ma Clio', exact: true })).toBeVisible();
  await expect(page.getByText('Réparation du rétroviseur', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajouter une dépense', exact: true }).first()).toBeEnabled();
});

test('le carnet est accessible depuis le tableau de bord', async ({ page }) => {
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}`);
  await page.getByRole('link', { name: /Carnet d.entretien/ }).click();
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}/maintenance$`));
  await expect(page.getByRole('heading', { name: /Carnet d.entretien/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vidange', exact: true })).toBeVisible();
});

test('un garage vide propose de créer le premier véhicule', async ({ page }) => {
  await mockApi(page, { emptyGarage: true });
  await page.goto('/');
  const addVehicle = page.getByRole('link', { name: 'Ajouter un véhicule', exact: true }).last();
  await expect(addVehicle).toBeVisible();
  await addVehicle.click();
  await expect(page).toHaveURL(/\/add-vehicle$/);
});

test('le tableau de bord reste utilisable sur mobile sans débordement', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}`);
  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
  await expect(page.getByText('Réparation du rétroviseur', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('la mise à jour du compteur est enregistrée et affichée', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}`);
  await page.getByRole('button', { name: 'Mettre à jour', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Mettre à jour le compteur' });
  await dialog.getByLabel('Kilométrage actuel (km)').fill('19500');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.odometer')).toContainText(/19\s?500/);
  expect(state.vehicles[0].currentOdometer).toBe(19500);
});

test('un historique indisponible reste identifiable après une erreur serveur', async ({ page }) => {
  const state = await mockApi(page);
  state.failures['GET /api/expenses'] = { status: 500 };
  await page.goto(`/vehicle/${vehicleId}`);
  await expect(page.getByRole('alert')).toContainText('Certaines données n’ont pas pu être chargées');
  await expect(page.getByText('Historique indisponible.')).toBeVisible();
  await expect(page.getByText('Aucune dépense pour le moment.')).toHaveCount(0);
});

test('changer de véhicule dans l’historique ferme la dépense en cours', async ({ page }) => {
  const state = await mockApi(page);
  state.vehicles.push({ ...state.vehicles[0], _id: 'veh2', name: 'Mon Partner', brand: 'Peugeot', model: 'Partner' });
  await page.goto(`/vehicle/${vehicleId}`);
  await page.getByLabel('Véhicule actif').selectOption('veh2');
  await expect(page.getByRole('heading', { name: 'Mon Partner', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ajouter une dépense', exact: true }).click();
  await page.locator('input[name="label"]').fill('Dépense en brouillon');
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ma Clio', exact: true })).toBeVisible();
  expect(state.requests.filter(request => request.method === 'POST' && request.path === '/api/expenses')).toHaveLength(0);
});

test('le menu mobile s’ouvre et permet de naviguer au clavier', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}`);
  const menu = page.getByRole('button', { name: 'Ouvrir le menu', exact: true });
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).not.toBeVisible();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const maintenance = page.getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Entretien', exact: true });
  await expect(maintenance).toBeVisible();
  await maintenance.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}/maintenance$`));
  await expect(page.getByRole('heading', { name: /Carnet d.entretien/ })).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});
