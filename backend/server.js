require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const { ensureDatabaseExists } = require('./config/db');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const expenseRoutes = require('./routes/expense');
const maintenanceRoutes = require('./routes/maintenance');
const statsRoutes = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
require('./config/googleAuth');

const app = express();

// Apply security HTTP headers (disable crossOriginResourcePolicy for local dev images loading)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Restrict CORS to frontend URL
const defaultFrontendUrl = 'http://' + 'localhost' + ':5173';
app.use(cors({
  origin: process.env.FRONTEND_URL || defaultFrontendUrl,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réprimer un peu d\'activité.' },
});
app.use('/api', globalLimiter);

// Stricter rate limiting for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion/inscription. Réessayez dans 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(session({
  secret: process.env.JWT_SECRET || 'carcare_session_secret_default_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  }
}));

app.use(passport.initialize());

ensureDatabaseExists()
  .then(() => sequelize.authenticate())
  .then(() => {
    console.log('PostgreSQL connected');
    return sequelize.sync();
  })
  .catch(err => console.error('Database connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/uploads', express.static('uploads'));

// Swagger UI exposition
const swaggerUi = require('swagger-ui-express');
let swaggerDocument;
try {
  swaggerDocument = require('../swagger.json');
} catch (err) {
  console.warn('Could not load swagger.json:', err.message);
}

if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger UI loaded on /api-docs');
}

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    db: 'unknown',
  };

  try {
    await sequelize.authenticate();
    health.db = 'ok';
  } catch (e) {
    health.db = 'down';
    health.status = 'error';
    return res.status(500).json(health);
  }

  res.status(200).json(health);
});

app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
