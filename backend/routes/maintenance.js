const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MaintenanceTask = require('../models/MaintenanceTask');
const Vehicle = require('../models/Vehicle');

router.post('/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.vehicleId, userId: req.user._id });
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const task = new MaintenanceTask({
      ...req.body,
      userId: req.user._id,
      vehicleId: vehicle._id,
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:vehicleId', auth, async (req, res) => {
  const tasks = await MaintenanceTask.find({ vehicleId: req.params.vehicleId, userId: req.user._id });
  res.json(tasks);
});

router.patch('/:taskId', auth, async (req, res) => {
  try {
    const task = await MaintenanceTask.findOne({ _id: req.params.taskId, userId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:taskId', auth, async (req, res) => {
  const deleted = await MaintenanceTask.findOneAndDelete({ _id: req.params.taskId, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Tâche introuvable' });
  res.json({ message: 'Tâche supprimée' });
});

router.post('/:taskId/complete', auth, async (req, res) => {
  try {
    const task = await MaintenanceTask.findOne({ _id: req.params.taskId, userId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    task.lastDoneKm = req.body.doneKm;
    task.lastDoneDate = req.body.doneDate;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
