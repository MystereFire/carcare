const { test, expect, mockApi, vehicleId } = require('./support/mocked-api');

test('l’historique filtre les catégories sans modifier les dépenses', async ({ page }) => {
  await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/expenses`);
  await expect(page.getByRole('heading', { name: 'Historique des dépenses' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Plein du trajet', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Réparation', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Réparation du rétroviseur', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Plein du trajet', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tout', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Plein du trajet', exact: true })).toBeVisible();
});

test('un plein est enregistré avec ses nombres et son véhicule', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/add-expense`);
  await page.locator('input[name="label"]').fill('Plein de retour');
  await page.locator('input[name="amount"]').fill('68.40');
  await page.locator('input[name="km"]').fill('19000');
  await page.locator('input[name="liters"]').fill('38');
  await page.locator('input[name="isFullFill"]').check();
  await page.getByRole('button', { name: 'Ajouter la dépense', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}$`));
  expect(state.expenses.find(expense => expense.label === 'Plein de retour')).toMatchObject({
    vehicleId, type: 'fuel', amount: 68.4, km: 19000, liters: 38, isFullFill: true,
  });
  expect(state.requests.filter(request => request.method === 'POST' && request.path === '/api/expenses')).toHaveLength(1);
});

test('la suppression confirmée enlève uniquement la dépense choisie', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/expenses`);
  page.on('dialog', dialog => dialog.accept());
  const row = page.getByRole('row').filter({ hasText: 'Réparation du rétroviseur' });
  await row.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Réparation du rétroviseur', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Plein du trajet', exact: true })).toBeVisible();
  expect(state.expenses).toHaveLength(2);
});

test('modifier une dépense conserve la modification après fermeture', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/expenses`);
  const row = page.getByRole('row').filter({ hasText: 'Plein du trajet' });
  await row.getByRole('button', { name: 'Modifier', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Modifier la dépense' });
  await dialog.locator('input[name="amount"]').fill('65.50');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row.getByRole('cell', { name: /65,50/ })).toBeVisible();
  expect(state.expenses.find(expense => expense._id === 'exp2').amount).toBe(65.5);
});

test('un échec de sauvegarde conserve le formulaire et la dépense originale', async ({ page }) => {
  const state = await mockApi(page);
  state.failures['PUT /api/expenses/exp2'] = { status: 500 };
  await page.goto(`/vehicle/${vehicleId}/expenses`);
  await page.getByRole('row').filter({ hasText: 'Plein du trajet' })
    .getByRole('button', { name: 'Modifier', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Modifier la dépense' });
  await dialog.locator('input[name="amount"]').fill('65.50');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Service indisponible');
  await expect(dialog.locator('input[name="amount"]')).toHaveValue('65.50');
  expect(state.expenses.find(expense => expense._id === 'exp2').amount).toBe(63);
});

test('sur mobile le formulaire défile jusqu’à la sauvegarde d’une dépense', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await mockApi(page);
  await page.goto(`/vehicle/${vehicleId}/add-expense`);
  const dialog = page.getByRole('dialog', { name: 'Ajouter une dépense' });
  await expect(dialog.getByRole('heading', { name: 'Ajouter une dépense' })).toBeInViewport();
  await dialog.locator('input[name="label"]').fill('Plein mobile');
  await dialog.locator('input[name="amount"]').fill('54');
  await dialog.locator('input[name="km"]').fill('19000');
  await dialog.locator('input[name="liters"]').fill('30');
  const save = dialog.getByRole('button', { name: 'Ajouter la dépense', exact: true });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport();
  await save.click();
  await expect(page).toHaveURL(new RegExp(`/vehicle/${vehicleId}$`));
  expect(state.expenses.find(expense => expense.label === 'Plein mobile')).toMatchObject({ amount: 54, km: 19000 });
});
