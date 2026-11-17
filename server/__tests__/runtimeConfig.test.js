const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { loadRuntimeConfig } = require('../config/runtime');

test('one-server defaults use the same port for HTTP and OAuth', () => {
  expect(loadRuntimeConfig({ PORT: '5100' })).toMatchObject({
    port: 5100,
    host: '0.0.0.0',
    apiUrl: 'http://localhost:5100',
    frontendUrl: 'http://localhost:5100',
    trustProxy: 0,
    googleEnabled: false,
  });
});

test('public origins normalize trailing slashes and preserve frontend override', () => {
  expect(loadRuntimeConfig({ API_URL: 'https://auto.example/', FRONTEND_URL: 'https://garage.example/', TRUST_PROXY: '1' })).toMatchObject({
    apiUrl: 'https://auto.example',
    frontendUrl: 'https://garage.example',
    trustProxy: 1,
  });
  expect(loadRuntimeConfig({ API_URL: 'https://auto.example/' }).frontendUrl).toBe('https://auto.example');
});

test.each([
  { PORT: '0' }, { PORT: '70000' }, { PORT: '5000x' }, { TRUST_PROXY: 'true' },
  { API_URL: 'ftp://auto.example' }, { FRONTEND_URL: 'https://garage.example/path' },
  { GOOGLE_CLIENT_ID: 'configured-without-secret' }, { SMTP_PORT: '-1' },
  { SMTP_SECURE: 'yes' }, { SMTP_USER: 'configured-without-host' },
])('invalid configuration is rejected without exposing values: %j', env => {
  expect(() => loadRuntimeConfig(env)).toThrow();
});

test('Google and SMTP require complete settings and accept explicit TLS', () => {
  expect(loadRuntimeConfig({ GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret', SMTP_HOST: 'smtp.example', SMTP_USER: 'test@example.com', SMTP_PASS: 'test-password', SMTP_PORT: '465', SMTP_SECURE: 'true' })).toMatchObject({
    googleEnabled: true,
    smtpPort: 465,
    smtpSecure: true,
  });
});

test('SQLite memory mode works in development without creating a literal filename', () => {
  const databaseModule = path.join(__dirname, '..', 'config', 'db.js');
  const output = execFileSync(process.execPath, ['-e', `const { sequelize } = require(${JSON.stringify(databaseModule)}); process.stdout.write(sequelize.options.storage); sequelize.close();`], {
    env: { ...process.env, NODE_ENV: 'development', DATABASE_URL: '', SQLITE_PATH: ':memory:' },
    encoding: 'utf8',
    windowsHide: true,
  });
  expect(output).toBe(':memory:');
});
