process.env.NODE_ENV = 'development';

async function main() {
  const { start } = require('../server/server');
  await start({ host: process.env.HOST?.trim() || '127.0.0.1' });
}

main().catch(error => {
  console.error('Démarrage impossible :', error.message);
  process.exitCode = 1;
});
