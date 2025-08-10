const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConsumptionSegments } = require('../services/consumptionService');

router.get('/vehicle/:id/consumption', auth, async (req, res) => {
  try {
    const segments = await getConsumptionSegments(req.params.id, req.user._id);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
