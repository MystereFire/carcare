const { test, expect } = require('@playwright/test');

const vehicleId = 'veh1';

const vehicleResponse = {
  _id: vehicleId,
  name: 'Car',
  brand: 'Brand',
  model: 'Model',
  year: 2020,
  initialKm: 0,
  currentOdometer: 0,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/vehicles/' + vehicleId, route => {
    route.fulfill({ json: vehicleResponse });
  });
  await page.route('**/api/expenses/' + vehicleId + '*', route => {
    route.fulfill({ json: { data: [] } });
  });
  await page.route('**/api/maintenance/' + vehicleId, route => {
    route.fulfill({ json: [] });
  });
});

test("bouton carnet d'entretien", async ({ page }) => {
  await page.goto(`/vehicle/${vehicleId}`);
  const button = page.getByRole('button', { name: "Carnet d'entretien" });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page).toHaveURL(`/vehicle/${vehicleId}/maintenance`);
});
