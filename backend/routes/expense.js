const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.get('/:vehicleId', auth, async (req, res) => {
    const expenses = await Expense.find({
        vehicleId: req.params.vehicleId,
        userId: req.user._id,
    });
    res.json(expenses);
});

router.post('/', auth, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      userId: req.user._id // 👈 nécessaire ici
    });
    await expense.save();
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
