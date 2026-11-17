const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
  const path = require('path');
  const projectRoot = path.join(__dirname, '..', '..');
  const inMemory = process.env.NODE_ENV === 'test' || process.env.SQLITE_PATH === ':memory:';
  const sqlitePath = process.env.SQLITE_PATH && !inMemory ? path.resolve(projectRoot, process.env.SQLITE_PATH) : path.join(projectRoot, 'data', 'carcare.sqlite');
  const directory = path.dirname(sqlitePath);
  if (!inMemory) require('fs').mkdirSync(directory, { recursive: true });
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: inMemory ? ':memory:' : sqlitePath,
    logging: false,
    define: { timestamps: false },
  });
} else {
  const pgUri = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/carcare';
  sequelize = new Sequelize(pgUri, {
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: false,
    },
  });
}

async function ensureDatabaseExists() {
  if (sequelize.getDialect() !== 'postgres') return;

  const pgUri = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/carcare';
  const connectionUrl = new URL(pgUri);
  const dbName = decodeURIComponent(connectionUrl.pathname.slice(1));
  connectionUrl.pathname = '/postgres';
  const baseUri = connectionUrl.toString();

  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error('Nom de base de données invalide.');
  }

  const { Client } = require('pg');
  const client = new Client({ connectionString: baseUri });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it...`);
      const createDbQuery = ['CREATE DATABASE "', dbName, '"'].join('');
      await client.query(createDbQuery);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    // Managed databases may prohibit CREATE DATABASE. Authentication below gives
    // the definitive readiness result when the target database already exists.
    if (!['42501', '42P04'].includes(err.code)) throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
};
