const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConsumptionSegments } = require('../services/consumptionService');
const { getDashboardData } = require('../controllers/dashboardController');
const { Vehicle } = require('../models');
const { validId } = require('../services/input');

router.get('/dashboard/:vehicleId', auth, getDashboardData);

router.get('/vehicle/:id/consumption', auth, async (req, res) => {
  try {
    const vehicle = validId(req.params.id) && await Vehicle.findOne({ where: { _id: req.params.id, userId: req.user._id } });
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const segments = await getConsumptionSegments(req.params.id, req.user._id);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
