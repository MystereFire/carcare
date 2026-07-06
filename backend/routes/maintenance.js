const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { MaintenanceTask, Vehicle } = require('../models');

router.post('/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { _id: req.params.vehicleId, userId: req.user._id } });
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    
    const { title, notes, intervalKm, intervalDays, lastDoneKm, lastDoneDate, inspectionDate, isInspection } = req.body;
    const task = await MaintenanceTask.create({
      title,
      notes,
      intervalKm,
      intervalDays,
      lastDoneKm,
      lastDoneDate,
      inspectionDate,
      isInspection,
      userId: req.user._id,
      vehicleId: vehicle._id,
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:vehicleId', auth, async (req, res) => {
  try {
    const tasks = await MaintenanceTask.findAll({
      where: { vehicleId: req.params.vehicleId, userId: req.user._id }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:taskId', auth, async (req, res) => {
  try {
    const task = await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    
    const { title, notes, intervalKm, intervalDays, lastDoneKm, lastDoneDate, inspectionDate, isInspection } = req.body;
    const updates = Object.create(null);
    if (title !== undefined) updates.title = title;
    if (notes !== undefined) updates.notes = notes;
    if (intervalKm !== undefined) updates.intervalKm = intervalKm;
    if (intervalDays !== undefined) updates.intervalDays = intervalDays;
    if (lastDoneKm !== undefined) updates.lastDoneKm = lastDoneKm;
    if (lastDoneDate !== undefined) updates.lastDoneDate = lastDoneDate;
    if (inspectionDate !== undefined) updates.inspectionDate = inspectionDate;
    if (isInspection !== undefined) updates.isInspection = isInspection;

    Object.assign(task, updates);
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:taskId', auth, async (req, res) => {
  try {
    const deleted = await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!deleted) return res.status(404).json({ error: 'Tâche introuvable' });
    await deleted.destroy();
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:taskId/complete', auth, async (req, res) => {
  try {
    const task = await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    task.lastDoneKm = req.body.doneKm;
    task.lastDoneDate = req.body.doneDate ? new Date(req.body.doneDate) : null;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
