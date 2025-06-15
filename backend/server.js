const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const expenseRoutes = require('./routes/expense');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/expenses', expenseRoutes);
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
