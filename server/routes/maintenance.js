const router = require('express').Router();
const auth = require('../middleware/auth');
const { MaintenanceTask, Vehicle, sequelize } = require('../models');
const input = require('../services/input');
const { computeNext, getAvgKmPerDay } = require('../services/maintenanceService');
const { advanceOdometer } = require('../services/odometerService');

router.use(auth);

function taskData(body, vehicle) {
  const data = {
    title: input.text(body.title, 'Titre', { required: true }),
    notes: input.text(body.notes, 'Notes', { max: 10000 }),
    intervalKm: input.number(body.intervalKm, 'Intervalle kilométrique', { min: 1 }),
    intervalDays: input.number(body.intervalDays, 'Intervalle en jours', { min: 1, max: 36500, integer: true }),
    lastDoneKm: input.number(body.lastDoneKm, 'Dernier kilométrage'),
    lastDoneDate: body.lastDoneDate instanceof Date ? body.lastDoneDate : input.date(body.lastDoneDate, 'Dernière réalisation'),
    inspectionDate: body.inspectionDate instanceof Date ? body.inspectionDate : input.date(body.inspectionDate, 'Prochain contrôle'),
    isInspection: input.boolean(body.isInspection, 'Contrôle technique'),
  };
  if (data.isInspection) {
    if (!data.inspectionDate) input.invalid('La prochaine échéance du contrôle est requise.');
    data.intervalKm = null;
    data.intervalDays = null;
  } else {
    if (data.intervalKm == null && data.intervalDays == null) input.invalid('Indiquez un intervalle en km ou en jours.');
    data.inspectionDate = null;
    if (data.intervalKm != null && data.lastDoneKm == null) data.lastDoneKm = vehicle.currentOdometer || 0;
    if (data.intervalDays != null && !data.lastDoneDate) data.lastDoneDate = new Date(new Date().toISOString().slice(0, 10));
  }
  return data;
}

async function ownedVehicle(id, userId) {
  return input.validId(id) && Vehicle.findOne({ where: { _id: id, userId } });
}

router.post('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await ownedVehicle(req.params.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const task = await MaintenanceTask.create({ ...taskData(req.body, vehicle), vehicleId: vehicle._id, userId: req.user._id });
    res.status(201).json(task);
  } catch (err) { input.respondError(res, err); }
});

router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await ownedVehicle(req.params.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const [tasks, avg] = await Promise.all([
      MaintenanceTask.findAll({ where: { vehicleId: vehicle._id, userId: req.user._id }, order: [['createdAt', 'ASC'], ['_id', 'ASC']] }),
      getAvgKmPerDay(vehicle._id),
    ]);
    res.json(tasks.map(task => computeNext(task.toJSON(), vehicle, avg)));
  } catch (err) { input.respondError(res, err); }
});

router.patch('/:taskId', async (req, res) => {
  try {
    const task = input.validId(req.params.taskId) && await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    const vehicle = await ownedVehicle(task.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    await task.update(taskData({ ...task.toJSON(), ...req.body }, vehicle));
    res.json(task);
  } catch (err) { input.respondError(res, err); }
});

router.delete('/:taskId', async (req, res) => {
  try {
    const task = input.validId(req.params.taskId) && await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    await task.destroy();
    res.json({ message: 'Tâche supprimée' });
  } catch (err) { input.respondError(res, err); }
});

router.post('/:taskId/complete', async (req, res) => {
  try {
    const task = input.validId(req.params.taskId) && await MaintenanceTask.findOne({ where: { _id: req.params.taskId, userId: req.user._id } });
    if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
    const vehicle = await ownedVehicle(task.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const doneKm = input.number(req.body.doneKm, 'Kilométrage de réalisation', { nullable: false });
    const doneDate = input.date(req.body.doneDate, 'Date de réalisation', { nullable: false });
    if (doneDate > new Date()) input.invalid('La réalisation ne peut pas être dans le futur.');
    if (task.lastDoneKm != null && doneKm < task.lastDoneKm) input.invalid('Le kilométrage précède la dernière réalisation.');
    if (task.lastDoneDate && doneDate.toISOString().slice(0, 10) < new Date(task.lastDoneDate).toISOString().slice(0, 10)) input.invalid('La date précède la dernière réalisation.');
    if (task.isInspection) {
      const next = input.date(req.body.inspectionDate, 'Prochaine échéance', { nullable: false });
      if (next <= doneDate) input.invalid('La prochaine échéance doit suivre la réalisation.');
      task.inspectionDate = next;
    }
    await sequelize.transaction(async transaction => {
      await advanceOdometer(vehicle._id, req.user._id, doneKm, transaction);
      task.lastDoneKm = doneKm;
      task.lastDoneDate = doneDate;
      await task.save({ transaction });
    });
    res.json(task);
  } catch (err) { input.respondError(res, err); }
});

module.exports = router;
