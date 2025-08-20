const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');

// Raw expenses endpoint returning all documents for a vehicle
// Supports optional date filtering via `from` and `to` query params (ISO strings)
router.get('/', auth, async (req, res) => {
  try {
    const { vehicleId, from, to } = req.query;
    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    const filter = {
      vehicleId,
      userId: req.user._id,
    };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const expenses = await Expense.find(filter).sort({ date: 1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:vehicleId', auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = {
    vehicleId: req.params.vehicleId,
    userId: req.user._id,
  };

  const total = await Expense.countDocuments(filter);
  const expenses = await Expense.find(filter)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: expenses,
  });
});

router.post('/', auth, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      userId: req.user._id // 👈 nécessaire ici
    });
    await expense.save();
    if (expense.km != null) {
      await Vehicle.findByIdAndUpdate(expense.vehicleId, { $max: { currentOdometer: expense.km } });
    }
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ error: 'Non autorisé' });
    if (req.body.km != null) {
      await Vehicle.findByIdAndUpdate(expense.vehicleId, { $max: { currentOdometer: req.body.km } });
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Dépense introuvable ou non autorisée' });
    }

    res.json({ message: 'Dépense supprimée' });
  } catch (err) {
    console.error('Erreur suppression dépense :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
