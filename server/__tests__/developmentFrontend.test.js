const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const vm = require('node:vm');

const runNode = promisify(execFile);

test.each([
  [{}, '127.0.0.1'],
  [{ HOST: '0.0.0.0' }, '0.0.0.0'],
])('development command respects an explicit host and otherwise stays on loopback: %j', (env, expectedHost) => {
  const start = jest.fn(async () => {});
  const source = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'dev.cjs'), 'utf8');
  vm.runInNewContext(source, {
    process: { env: { ...env, NODE_ENV: 'production' } },
    require: () => ({ start }),
    console,
  });
  expect(start).toHaveBeenCalledWith({ host: expectedHost });
});

test('development frontend blocks server and data files while serving the app and health endpoint', async () => {
  const fixture = path.join(__dirname, 'fixtures', 'developmentFrontendProbe.cjs');
  const { stdout } = await runNode(process.execPath, [fixture], {
    cwd: path.join(__dirname, '..', '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HOST: '127.0.0.1', PORT: '5000',
      API_URL: 'http://localhost:5000', FRONTEND_URL: 'http://localhost:5000',
      DATABASE_URL: '', SQLITE_PATH: ':memory:',
      JWT_SECRET: 'isolated-development-access-test-secret',
      GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '',
      SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', SMTP_PORT: '587', SMTP_SECURE: 'false',
      TRUST_PROXY: '0', VITE_API_URL: '', VITE_GOOGLE_AUTH_ENABLED: 'false',
    },
    timeout: 45000,
    encoding: 'utf8',
    windowsHide: true,
  });
  const marker = stdout.split('VITE_ACCESS_PROBE:')[1];
  expect(JSON.parse(marker)).toEqual({
    '/server/config/runtime.js': 403,
    '/data/probe': 403,
    '/src/main.jsx': 200,
    '/health': 200,
  });
}, 60000);
