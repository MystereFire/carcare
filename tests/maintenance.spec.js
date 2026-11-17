const { test, expect, mockApi, vehicleId } = require('./support/mocked-api');

test('les tâches affichent leur statut et le filtre urgent fonctionne', async ({ page }) => {
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await expect(page.getByRole('heading', { name: 'Vidange', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filtre habitacle', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Urgent', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vidange', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filtre habitacle', exact: true })).toHaveCount(0);
});

test('une tâche créée apparaît après la sauvegarde', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await page.getByRole('button', { name: 'Nouvelle tâche', exact: true }).click();
  await page.locator('input[name="title"]').fill('Courroie accessoires');
  await page.locator('input[name="intervalKm"]').fill('60000');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Courroie accessoires', exact: true })).toBeVisible();
  expect(state.tasks.find(task => task.title === 'Courroie accessoires')).toMatchObject({ intervalKm: expect.anything() });
  expect(state.requests.filter(request => request.method === 'POST' && request.path === `/api/maintenance/${vehicleId}`)).toHaveLength(1);
});

test('une tâche terminée reprend un statut à jour', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  const taskCard = page.getByRole('heading', { name: 'Vidange', exact: true }).locator('../..');
  await taskCard.hover();
  await taskCard.getByRole('button', { name: 'Fait', exact: true }).click();
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Marquer comme fait' })).toHaveCount(0);
  await expect(taskCard.getByText('OK', { exact: true })).toBeVisible();
  expect(state.tasks[0].status).toBe('OK');
  expect(state.requests.filter(request => request.path === '/api/maintenance/task1/complete')).toHaveLength(1);
});

test('un échec de validation ne marque pas une tâche comme terminée', async ({ page }) => {
  const state = await mockApi(page);
  state.failures['POST /api/maintenance/task1/complete'] = { status: 500 };
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  const taskCard = page.getByRole('heading', { name: 'Vidange', exact: true }).locator('../..');
  await taskCard.hover();
  await taskCard.getByRole('button', { name: 'Fait', exact: true }).click();
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await expect(page.getByText(/Erreur serveur|Service indisponible/i)).toBeVisible();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  await expect(taskCard.getByText('Urgent', { exact: true })).toBeVisible();
  expect(state.tasks[0].status).toBe('DUE');
});

test('une erreur de chargement ne présente pas le carnet comme à jour', async ({ page }) => {
  const state = await mockApi(page);
  state.failures[`GET /api/maintenance/${vehicleId}`] = { status: 500 };
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await expect(page.getByText('Impossible de charger le carnet d’entretien.')).toBeVisible();
  await expect(page.getByText('Tout est à jour !')).toHaveCount(0);
});

test('la création de tâche se ferme avec Échap sans créer de donnée', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  const createButton = page.getByRole('button', { name: 'Nouvelle tâche', exact: true });
  await createButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(createButton).toBeFocused();
  expect(state.tasks).toHaveLength(2);
});

test('le carnet reprend la date de contrôle technique des véhicules existants', async ({ page }) => {
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/maintenance`);
  await expect(page.getByText('17/11/2027', { exact: true })).toBeVisible();
  await expect(page.getByText(/Aucune date renseignée/)).toHaveCount(0);
});
