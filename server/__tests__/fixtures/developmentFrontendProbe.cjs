const fs = require('node:fs');
const path = require('node:path');
const { start } = require('../../server');
const { sequelize } = require('../../models');

const probeName = `vite-access-probe-${process.pid}.txt`;
const probeFile = path.join(process.cwd(), 'data', probeName);
let server;

async function probe() {
  fs.mkdirSync(path.dirname(probeFile), { recursive: true });
  fs.writeFileSync(probeFile, 'isolated-development-probe', { flag: 'wx' });
  try {
    server = await start({ host: '127.0.0.1', port: 0 });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const results = {};
    for (const route of ['/server/config/runtime.js', `/data/${probeName}`, '/src/main.jsx', '/health']) {
      const response = await fetch(origin + route);
      results[route.startsWith('/data/') ? '/data/probe' : route] = response.status;
      await response.arrayBuffer();
    }
    process.stdout.write(`\nVITE_ACCESS_PROBE:${JSON.stringify(results)}`);
  } finally {
    fs.unlinkSync(probeFile);
    if (server) {
      await new Promise(resolve => server.close(resolve));
      await sequelize.close();
    }
  }
}

probe().catch(error => { console.error(error.stack); process.exitCode = 1; });
