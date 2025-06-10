const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');

router.get('/', async (req, res) => {
    const all = await Maintenance.find();
    res.json(all);
});

router.post('/', async (req, res) => {
    const newItem = new Maintenance(req.body);
    await newItem.save();
    res.status(201).json(newItem);
});

module.exports = router;
