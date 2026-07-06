const express = require('express');
const router = express.Router();
const { Expense, Vehicle } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

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
      if (from) filter.date[Op.gte] = new Date(from);
      if (to) filter.date[Op.lte] = new Date(to);
    }

    const expenses = await Expense.findAll({
      where: filter,
      order: [['date', 'ASC']],
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export expenses to CSV
router.get('/vehicle/:vehicleId/export', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { vehicleId: req.params.vehicleId, userId: req.user._id },
      order: [['date', 'ASC']],
    });
    
    const headers = ['Date', 'Type', 'Label', 'Amount', 'Km', 'Liters', 'IsFullFill', 'Notes'];
    const rows = expenses.map(exp => [
      exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
      exp.type,
      exp.label || '',
      exp.amount || '',
      exp.km || '',
      exp.liters || '',
      exp.isFullFill ? 'true' : 'false',
      (exp.notes || '').replace(/,/g, ' '),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${req.params.vehicleId}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'exportation' });
  }
});

// Import expenses from CSV text
router.post('/vehicle/:vehicleId/import', auth, async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) {
      return res.status(400).json({ error: 'Le contenu CSV (csvText) est requis.' });
    }

    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'Le fichier CSV est vide ou invalide.' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const expectedHeaders = ['date', 'type', 'label', 'amount', 'km', 'liters', 'isfullfill', 'notes'];
    const hasRequired = expectedHeaders.every(h => headers.includes(h));
    if (!hasRequired) {
      return res.status(400).json({ error: `Le fichier CSV doit contenir les colonnes : ${expectedHeaders.join(', ')}` });
    }

    const expensesData = [];
    const validTypes = new Set(['fuel', 'maintenance', 'repair']);
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cols[index] ? cols[index].trim() : null;
      });

      const type = validTypes.has(row.type) ? row.type : 'repair';
      const amount = row.amount ? parseFloat(row.amount) : null;
      const km = row.km ? parseFloat(row.km) : null;
      const liters = row.liters ? parseFloat(row.liters) : null;
      const isFullFill = row.isfullfill === 'true' || row.isfullfill === '1';

      expensesData.push({
        userId: req.user._id,
        vehicleId: req.params.vehicleId,
        type,
        label: row.label || '',
        amount,
        date: row.date ? new Date(row.date) : new Date(),
        km,
        liters,
        isFullFill,
        notes: row.notes || '',
      });
    }

    if (expensesData.length > 0) {
      await Expense.bulkCreate(expensesData);

      const validKms = expensesData.map(e => e.km).filter(k => k != null);
      if (validKms.length > 0) {
        const maxImportedKm = Math.max(...validKms);
        const vehicle = await Vehicle.findByPk(req.params.vehicleId);
        if (vehicle && (vehicle.currentOdometer || 0) < maxImportedKm) {
          vehicle.currentOdometer = maxImportedKm;
          await vehicle.save();
        }
      }
    }

    res.json({ message: `${expensesData.length} dépenses importées avec succès.` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'importation' });
  }
});

router.get('/:vehicleId', auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = {
    vehicleId: req.params.vehicleId,
    userId: req.user._id,
  };

  const total = await Expense.count({ where: filter });
  const expenses = await Expense.findAll({
    where: filter,
    offset: (page - 1) * limit,
    limit: limit,
  });

  res.json({
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: expenses,
  });
});

router.post('/', auth, async (req, res) => {
  try {
    const { vehicleId, type, label, amount, date, km, liters, isFullFill, notes } = req.body;
    const expense = await Expense.create({
      vehicleId,
      type,
      label,
      amount,
      date,
      km,
      liters,
      isFullFill,
      notes,
      userId: req.user._id
    });
    if (expense.km != null) {
      const vehicle = await Vehicle.findByPk(expense.vehicleId);
      if (vehicle) {
        vehicle.currentOdometer = Math.max(vehicle.currentOdometer || 0, expense.km);
        await vehicle.save();
      }
    }
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { _id: req.params.id, userId: req.user._id }
    });
    if (!expense) return res.status(404).json({ error: 'Non autorisé' });
    
    const { vehicleId, type, label, amount, date, km, liters, isFullFill, notes } = req.body;
    await expense.update({
      vehicleId,
      type,
      label,
      amount,
      date,
      km,
      liters,
      isFullFill,
      notes
    });

    if (km != null) {
      const vehicle = await Vehicle.findByPk(expense.vehicleId);
      if (vehicle) {
        vehicle.currentOdometer = Math.max(vehicle.currentOdometer || 0, km);
        await vehicle.save();
      }
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Expense.findOne({
      where: {
        _id: req.params.id,
        userId: req.user._id,
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Dépense introuvable ou non autorisée' });
    }

    await deleted.destroy();

    res.json({ message: 'Dépense supprimée' });
  } catch (err) {
    console.error('Erreur suppression dépense :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
