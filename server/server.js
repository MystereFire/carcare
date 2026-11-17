const path = require('path');
const http = require('http');
const projectRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env'), quiet: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { loadRuntimeConfig } = require('./config/runtime');
const config = loadRuntimeConfig();
const { sequelize } = require('./models');
const { ensureDatabaseExists } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  if (isProduction) throw new Error('JWT_SECRET est requis en production. Configurez le fichier .env à la racine.');
  process.env.JWT_SECRET = require('crypto').randomBytes(48).toString('hex');
  if (process.env.NODE_ENV !== 'test') console.warn('JWT_SECRET absent : clé temporaire de développement, les sessions expirent au redémarrage.');
}

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' }, contentSecurityPolicy: isProduction ? undefined : false }));
app.use(cors({ origin: process.env.FRONTEND_URL ? config.frontendUrl : false, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion ou d’inscription. Réessayez dans 15 minutes.' },
});
app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const passport = require('passport');
require('./config/googleAuth');
if (config.googleEnabled) {
  app.use(require('express-session')({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: isProduction, httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 },
  }));
}
app.use(passport.initialize());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicle'));
app.use('/api/expenses', require('./routes/expense'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route API introuvable' }));

app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));
app.use('/uploads', (req, res) => res.status(404).json({ error: 'Image introuvable' }));

const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime(), timestamp: Date.now() });
  } catch {
    res.status(503).json({ status: 'error', db: 'down', timestamp: Date.now() });
  }
});

// API errors remain JSON, independently of Vite or the production app shell.
app.use(errorHandler);
let frontendAttached = false;

async function attachFrontend(httpServer) {
  if (frontendAttached || process.env.NODE_ENV === 'test') return null;
  if (isProduction) {
    const directory = path.join(projectRoot, 'dist');
    require('./services/frontendService').attachProductionFrontend(app, directory);
    frontendAttached = true;
    return null;
  }
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: projectRoot,
    configFile: path.join(projectRoot, 'vite.config.mjs'),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  frontendAttached = true;
  return vite;
}

async function start({ port = config.port, host = config.host } = {}) {
  const server = http.createServer(app);
  let vite;
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    await sequelize.sync();
    vite = await attachFrontend(server);
    app.use((req, res) => res.status(404).json({ error: 'Ressource introuvable' }));
    app.use(errorHandler);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, resolve);
    });
    console.log(`CarCare : http://localhost:${server.address().port}`);
    server.once('close', () => {
      vite?.close().catch(console.error);
    });
    return server;
  } catch (err) {
    await vite?.close();
    await sequelize.close();
    throw err;
  }
}

if (require.main === module) {
  start().catch(err => {
    console.error('Démarrage impossible :', err.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
