const express = require('express');
const router = express.Router();
const { Expense, Vehicle, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const input = require('../services/input');
const { advanceOdometer } = require('../services/odometerService');
const { parseCsv, csvCell } = require('../services/csvService');

router.use(auth);

async function ownedVehicle(id, userId) {
  if (!input.validId(id)) return null;
  return Vehicle.findOne({ where: { _id: id, userId } });
}

function expenseData(body) {
  if (!['fuel', 'maintenance', 'repair'].includes(body.type)) input.invalid('Type de dépense invalide.');
  const data = {
    type: body.type,
    label: input.text(body.label, 'Libellé'),
    amount: input.number(body.amount, 'Montant', { nullable: false }),
    date: input.date(body.date instanceof Date ? body.date.toISOString() : body.date, 'Date', { nullable: false }),
    km: input.number(body.km, 'Kilométrage'),
    liters: body.type === 'fuel' ? input.number(body.liters, 'Litres', { min: 0.01, max: 10000 }) : null,
    isFullFill: body.type === 'fuel' ? input.boolean(body.isFullFill, 'Plein complet') : false,
    notes: input.text(body.notes, 'Notes', { max: 10000 }),
  };
  if (data.isFullFill && (data.liters == null || data.km == null)) input.invalid('Un plein complet nécessite des litres et un kilométrage.');
  return data;
}

router.get('/', async (req, res) => {
  try {
    const { vehicleId, from, to } = req.query;
    if (!vehicleId) return res.status(400).json({ error: 'vehicleId est requis.' });
    if (!(await ownedVehicle(vehicleId, req.user._id))) return res.status(404).json({ error: 'Véhicule introuvable' });
    const filter = { vehicleId, userId: req.user._id };
    if (from || to) {
      const fromDate = from ? input.date(from, 'Début', { nullable: false }) : null;
      const toDate = to ? input.date(to, 'Fin', { nullable: false }) : null;
      if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(to)) toDate.setUTCHours(23, 59, 59, 999);
      if (fromDate && toDate && fromDate > toDate) input.invalid('Période invalide.');
      filter.date = {};
      if (fromDate) filter.date[Op.gte] = fromDate;
      if (toDate) filter.date[Op.lte] = toDate;
    }
    res.json(await Expense.findAll({ where: filter, order: [['date', 'ASC'], ['km', 'ASC'], ['_id', 'ASC']] }));
  } catch (err) { input.respondError(res, err); }
});

router.get('/vehicle/:vehicleId/export', async (req, res) => {
  try {
    if (!(await ownedVehicle(req.params.vehicleId, req.user._id))) return res.status(404).json({ error: 'Véhicule introuvable' });
    const expenses = await Expense.findAll({ where: { vehicleId: req.params.vehicleId, userId: req.user._id }, order: [['date', 'ASC'], ['km', 'ASC']] });
    const rows = [['Date', 'Type', 'Label', 'Amount', 'Km', 'Liters', 'IsFullFill', 'Notes'], ...expenses.map(exp => [
      exp.date ? new Date(exp.date).toISOString().split('T')[0] : '', exp.type, exp.label, exp.amount, exp.km, exp.liters, exp.isFullFill, exp.notes,
    ])];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${req.params.vehicleId}.csv"`);
    res.send(rows.map(row => row.map(csvCell).join(',')).join('\r\n'));
  } catch (err) { input.respondError(res, err); }
});

router.post('/vehicle/:vehicleId/import', async (req, res) => {
  try {
    const vehicle = await ownedVehicle(req.params.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const rows = parseCsv(req.body.csvText);
    if (rows.length < 2) input.invalid('Le fichier CSV est vide.');
    if (rows.length > 5001) input.invalid('Le fichier CSV est limité à 5 000 dépenses.');
    const headers = rows.shift().map(h => h.trim().toLowerCase());
    const expected = ['date', 'type', 'label', 'amount', 'km', 'liters', 'isfullfill', 'notes'];
    if (!expected.every(h => headers.includes(h)) || new Set(headers).size !== headers.length) input.invalid(`Colonnes requises : ${expected.join(', ')}`);
    const data = rows.map((cols, index) => {
      if (cols.length !== headers.length) input.invalid(`Ligne ${index + 2} : nombre de colonnes invalide.`);
      const row = Object.fromEntries(headers.map((h, i) => [h, cols[i]]));
      try {
        return { ...expenseData({ ...row, isFullFill: row.isfullfill }), vehicleId: vehicle._id, userId: req.user._id };
      } catch (err) { err.message = `Ligne ${index + 2} : ${err.message}`; throw err; }
    });
    await sequelize.transaction(async transaction => {
      await Expense.bulkCreate(data, { transaction, validate: true });
      const kms = data.map(row => row.km).filter(km => km != null);
      if (kms.length) await advanceOdometer(vehicle._id, req.user._id, Math.max(...kms), transaction);
    });
    res.json({ message: `${data.length} dépenses importées avec succès.`, imported: data.length });
  } catch (err) { input.respondError(res, err); }
});

router.get('/:vehicleId', async (req, res) => {
  try {
    const { page, limit } = input.pagination(req.query);
    if (!(await ownedVehicle(req.params.vehicleId, req.user._id))) return res.json({ page, totalPages: 1, data: [] });
    const filter = { vehicleId: req.params.vehicleId, userId: req.user._id };
    const { count, rows } = await Expense.findAndCountAll({ where: filter, offset: (page - 1) * limit, limit, order: [['date', 'DESC'], ['km', 'DESC'], ['_id', 'ASC']] });
    res.json({ page, totalPages: Math.ceil(count / limit) || 1, data: rows });
  } catch (err) { input.respondError(res, err); }
});

router.post('/', async (req, res) => {
  try {
    const vehicle = await ownedVehicle(req.body.vehicleId, req.user._id);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable' });
    const data = expenseData(req.body);
    const expense = await sequelize.transaction(async transaction => {
      const expense = await Expense.create({ ...data, vehicleId: vehicle._id, userId: req.user._id }, { transaction });
      await advanceOdometer(vehicle._id, req.user._id, data.km, transaction);
      return expense;
    });
    res.status(201).json(expense);
  } catch (err) { input.respondError(res, err); }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = input.validId(req.params.id) && await Expense.findOne({ where: { _id: req.params.id, userId: req.user._id } });
    if (!expense) return res.status(404).json({ error: 'Dépense introuvable' });
    const vehicleId = req.body.vehicleId ?? expense.vehicleId;
    if (!(await ownedVehicle(vehicleId, req.user._id))) return res.status(404).json({ error: 'Véhicule introuvable' });
    const data = expenseData({ ...expense.toJSON(), ...req.body });
    await sequelize.transaction(async transaction => {
      await expense.update({ ...data, vehicleId }, { transaction });
      await advanceOdometer(vehicleId, req.user._id, data.km, transaction);
    });
    res.json(expense);
  } catch (err) { input.respondError(res, err); }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = input.validId(req.params.id) && await Expense.findOne({ where: { _id: req.params.id, userId: req.user._id } });
    if (!expense) return res.status(404).json({ error: 'Dépense introuvable' });
    await expense.destroy();
    res.json({ message: 'Dépense supprimée' });
  } catch (err) { input.respondError(res, err); }
});

module.exports = router;
