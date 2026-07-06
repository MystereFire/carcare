const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else {
  const pgUri = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/carcare';
  console.log('Database URI loaded:', pgUri.replace(/:([^:@]+)@/, ':****@'));
  sequelize = new Sequelize(pgUri, {
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: false,
    },
  });
}

async function ensureDatabaseExists() {
  if (process.env.NODE_ENV === 'test') return;
  
  const pgUri = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/carcare';
  const match = pgUri.match(/^(postgres:\/\/[^/]+)\/([^?#]+)/);
  if (!match) return;
  
  const baseUri = match[1] + '/postgres';
  const dbName = match[2];
  
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    console.error(`Invalid database name "${dbName}". Database auto-creation aborted to prevent SQL injection.`);
    return;
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
    console.error('Error ensuring database exists:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
};
