const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');

// Config stockage image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Assure-toi que ce dossier existe
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get('/', auth, async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id });
  res.json(vehicles);
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, brand, model, year, plate, vin, tankSize, initialKm, acquisitionDate } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const vehicle = new Vehicle({
      userId: req.user._id,
      name,
      brand,
      model,
      year,
      plate,
      vin,
      tankSize,
      initialKm,
      acquisitionDate,
      image,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l’ajout du véhicule' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || vehicle.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: 'Véhicule introuvable ou non autorisé' });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || vehicle.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: 'Véhicule introuvable ou non autorisé' });
    }

    const { name, brand, model, year, plate, vin, tankSize, initialKm, acquisitionDate } = req.body;
    if (name !== undefined) vehicle.name = name;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (plate !== undefined) vehicle.plate = plate;
    if (vin !== undefined) vehicle.vin = vin;
    if (tankSize !== undefined) vehicle.tankSize = tankSize;
    if (initialKm !== undefined) vehicle.initialKm = initialKm;
    if (acquisitionDate !== undefined) vehicle.acquisitionDate = acquisitionDate;
    if (req.file) vehicle.image = `/uploads/${req.file.filename}`;

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du véhicule' });
  }
});

module.exports = router;
