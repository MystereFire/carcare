const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables before requiring modules that depend on them
dotenv.config();

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
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(session({
  secret: process.env.JWT_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure: true in production with https
}));

app.use(passport.initialize());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/uploads', express.static('uploads'));

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    db: 'unknown',
  };

  try {
    // Exemple MongoDB
    await mongoose.connection.db.admin().ping();
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
