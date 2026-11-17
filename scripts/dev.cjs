process.env.NODE_ENV = 'development';

async function main() {
  const { start } = require('../server/server');
  await start();
}

main().catch(error => {
  console.error('Démarrage impossible :', error.message);
  process.exitCode = 1;
});
