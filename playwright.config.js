const { defineConfig } = require('@playwright/test');

const port = Number(process.env.PLAYWRIGHT_PORT || 5174);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT doit être un port entier entre 1 et 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: 'list',
  webServer: {
    command: 'node server/server.js',
    cwd: __dirname,
    url: `${baseURL}/health`,
    env: {
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: String(port),
      API_URL: baseURL,
      FRONTEND_URL: baseURL,
      DATABASE_URL: '',
      SQLITE_PATH: ':memory:',
      JWT_SECRET: 'carcare-playwright-test-only-local-secret',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      VITE_API_URL: '',
      VITE_GOOGLE_AUTH_ENABLED: 'false',
    },
    timeout: 120 * 1000,
    reuseExistingServer: false,
  },
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
