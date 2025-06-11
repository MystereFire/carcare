const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.get('/:vehicleId', auth, async (req, res) => {
    const expenses = await Expense.find({ vehicleId: req.params.vehicleId });
    res.json(expenses);
});

router.post('/', auth, async (req, res) => {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
});

module.exports = router;
