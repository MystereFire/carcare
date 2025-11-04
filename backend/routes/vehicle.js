const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const Vehicle = require("../models/Vehicle");
const Expense = require("../models/Expense");
const MaintenanceTask = require("../models/MaintenanceTask");
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

const upload = multer({ storage });

router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = { userId: req.user._id };
  const total = await Vehicle.countDocuments(filter);
  const vehicles = await Vehicle.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

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
      currentOdometer: initialKm,
      acquisitionDate,
      image,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du vehicule" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || vehicle.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: "Vehicule introuvable ou non autorise" });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || vehicle.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: "Vehicule introuvable ou non autorise" });
    }

    const { name, brand, model, year, plate, vin, tankSize, initialKm, acquisitionDate, currentOdometer } = req.body;
    if (name !== undefined) vehicle.name = name;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (plate !== undefined) vehicle.plate = plate;
    if (vin !== undefined) vehicle.vin = vin;
    if (tankSize !== undefined) vehicle.tankSize = tankSize;
    if (initialKm !== undefined) vehicle.initialKm = initialKm;
    if (acquisitionDate !== undefined) vehicle.acquisitionDate = acquisitionDate;
    if (currentOdometer !== undefined) {
      vehicle.currentOdometer = Math.max(vehicle.currentOdometer || 0, currentOdometer);
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
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
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
      Expense.deleteMany({ vehicleId: vehicle._id, userId: req.user._id }),
      MaintenanceTask.deleteMany({ vehicleId: vehicle._id, userId: req.user._id }),
    ]);

    await vehicle.deleteOne();

    res.json({ message: "Vehicule supprime" });
  } catch (err) {
    console.error("Erreur suppression vehicule :", err);
    res.status(500).json({ error: "Erreur lors de la suppression du vehicule" });
  }
});

module.exports = router;
