const { test, expect, mockApi, token } = require('./support/mocked-api');

test('une page privée redirige vers la connexion', async ({ page }) => {
  await mockApi(page, { authenticated: false });
  await page.goto('/vehicle/veh1/maintenance');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
});

test('la connexion conserve la destination demandée', async ({ page }) => {
  const state = await mockApi(page, { authenticated: false });
  await page.goto('/vehicle/veh1/maintenance');
  await page.getByLabel(/Adresse e.mail/i).fill('camille@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicle\/veh1\/maintenance$/);
  await expect(page.getByRole('heading', { name: /Carnet d.entretien/ })).toBeVisible();
  expect(state.requests.find(request => request.path === '/api/auth/login').data)
    .toEqual({ email: 'camille@example.com', password: 'password123' });
  expect(await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'))).toBe(token);
});

test('les identifiants refusés affichent une erreur sans perdre le formulaire', async ({ page }) => {
  const state = await mockApi(page, { authenticated: false });
  state.failures['POST /api/auth/login'] = { status: 401, error: 'Identifiants invalides' };
  await page.goto('/login');
  await page.getByLabel(/Adresse e.mail/i).fill('camille@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByText(/Identifiants invalides/i)).toBeVisible();
  await expect(page.getByLabel(/Adresse e.mail/i)).toHaveValue('camille@example.com');
  await expect(page).toHaveURL(/\/login$/);
});

test('le retour OAuth conserve la session sous StrictMode et retire le jeton de l’URL', async ({ page }) => {
  await mockApi(page, { authenticated: false });
  await page.goto(`/oauth2?token=${encodeURIComponent(token)}`);
  await expect(page).toHaveURL(/\/vehicle\/veh1$/);
  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(token);
  expect(new URL(page.url()).searchParams.has('token')).toBe(false);
});

test('un retour OAuth sans jeton revient à la connexion', async ({ page }) => {
  await mockApi(page, { authenticated: false });
  await page.goto('/oauth2');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('une session expirée reste déconnectée après le rechargement', async ({ page }) => {
  const state = await mockApi(page);
  state.failures['GET /api/vehicles'] = { status: 401, error: 'Session invalide ou expirée' };
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('currentVehicleId'))).toBeNull();
});
