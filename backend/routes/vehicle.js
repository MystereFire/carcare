const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { Vehicle, Expense, MaintenanceTask } = require("../models");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Seules les images (jpeg, jpg, png, gif, webp) sont autorisees."));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = { userId: req.user._id };
  const total = await Vehicle.count({ where: filter });
  const vehicles = await Vehicle.findAll({
    where: filter,
    order: [['createdAt', 'DESC']],
    offset: (page - 1) * limit,
    limit: limit,
  });

  res.json({
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: vehicles,
  });
});

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, brand, model, year, plate, vin, tankSize, initialKm, acquisitionDate } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      name,
      brand,
      model,
      year: year ? parseInt(year, 10) : null,
      plate,
      vin,
      tankSize: tankSize ? parseFloat(tankSize) : null,
      initialKm: initialKm ? parseFloat(initialKm) : null,
      currentOdometer: initialKm ? parseFloat(initialKm) : 0,
      acquisitionDate: acquisitionDate || null,
      image,
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du vehicule" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle || vehicle.userId !== req.user._id) {
      return res.status(404).json({ error: "Vehicule introuvable ou non autorise" });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle || vehicle.userId !== req.user._id) {
      return res.status(404).json({ error: "Vehicule introuvable ou non autorise" });
    }

    const { name, brand, model, year, plate, vin, tankSize, initialKm, acquisitionDate, currentOdometer } = req.body;
    if (name !== undefined) vehicle.name = name;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year ? parseInt(year, 10) : null;
    if (plate !== undefined) vehicle.plate = plate;
    if (vin !== undefined) vehicle.vin = vin;
    if (tankSize !== undefined) vehicle.tankSize = tankSize ? parseFloat(tankSize) : null;
    if (initialKm !== undefined) vehicle.initialKm = initialKm ? parseFloat(initialKm) : null;
    if (acquisitionDate !== undefined) vehicle.acquisitionDate = acquisitionDate || null;
    if (currentOdometer !== undefined) {
      vehicle.currentOdometer = Math.max(vehicle.currentOdometer || 0, parseFloat(currentOdometer));
    }
    if (req.file) vehicle.image = `/uploads/${req.file.filename}`;

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise a jour du vehicule" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { _id: req.params.id, userId: req.user._id } });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicule introuvable ou non autorise" });
    }

    if (vehicle.image) {
      const imageFile = path.basename(vehicle.image);
      const imagePath = path.join(__dirname, "..", "uploads", imageFile);
      try {
        await fs.unlink(imagePath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.warn(`Erreur suppression image ${imageFile} :`, fileErr);
        }
      }
    }

    await Promise.all([
      Expense.destroy({ where: { vehicleId: vehicle._id, userId: req.user._id } }),
      MaintenanceTask.destroy({ where: { vehicleId: vehicle._id, userId: req.user._id } }),
    ]);

    await vehicle.destroy();

    res.json({ message: "Vehicule supprime" });
  } catch (err) {
    console.error("Erreur suppression vehicule :", err);
    res.status(500).json({ error: "Erreur lors de la suppression du vehicule" });
  }
});

module.exports = router;
