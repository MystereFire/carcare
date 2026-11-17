const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Vehicle, sequelize } = require('../models');
const auth = require('../middleware/auth');
const input = require('../services/input');
const { advanceOdometer } = require('../services/odometerService');

const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsPath, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsPath,
    filename: (req, file, cb) => cb(null, `${require('crypto').randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  fileFilter: (req, file, cb) => {
    const extensions = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
    if (extensions[path.extname(file.originalname).toLowerCase()] === file.mimetype) return cb(null, true);
    const error = new Error('Seules les images JPEG, PNG, GIF et WebP sont autorisées.');
    error.status = 400;
    cb(error);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 },
}).single('image');

function receiveImage(req, res, next) {
  upload(req, res, err => err ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'L’image est limitée à 5 Mo.' : err.message }) : next());
}

async function removeImage(image) {
  if (!image || !image.startsWith('/uploads/')) return;
  await fs.promises.unlink(path.join(uploadsPath, path.basename(image))).catch(err => {
    if (err.code !== 'ENOENT') console.error('Suppression image impossible:', err.message);
  });
}

function vehicleData(body, create = false) {
  const data = {};
  for (const field of ['name', 'brand', 'model', 'plate', 'vin']) {
    if (body[field] !== undefined) data[field] = input.text(body[field], field);
  }
  if (create && !data.name && !(data.brand && data.model)) input.invalid('Indiquez un nom ou la marque et le modèle.');
  if (body.year !== undefined) data.year = input.number(body.year, 'Année', { min: 1886, max: new Date().getFullYear() + 1, integer: true });
  if (body.tankSize !== undefined) data.tankSize = input.number(body.tankSize, 'Réservoir', { min: 0.1, max: 10000 });
  if (body.initialKm !== undefined) data.initialKm = input.number(body.initialKm, 'Kilométrage initial');
  for (const field of ['acquisitionDate', 'technicalInspectionDate']) {
    if (body[field] !== undefined) data[field] = input.date(body[field], field);
  }
  return data;
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { page, limit } = input.pagination(req.query);
    const { count, rows } = await Vehicle.findAndCountAll({ where: { userId: req.user._id }, order: [['createdAt', 'DESC'], ['_id', 'ASC']], offset: (page - 1) * limit, limit });
    res.json({ page, totalPages: Math.ceil(count / limit) || 1, data: rows });
  } catch (err) { input.respondError(res, err); }
});

router.post('/', receiveImage, async (req, res) => {
  try {
    const data = vehicleData(req.body, true);
    const current = req.body.currentOdometer === undefined ? 0 : input.number(req.body.currentOdometer, 'Compteur', { nullable: false });
    const vehicle = await Vehicle.create({ ...data, userId: req.user._id, currentOdometer: Math.max(current, data.initialKm || 0), image: req.file ? `/uploads/${req.file.filename}` : null });
    res.status(201).json(vehicle);
  } catch (err) {
    if (req.file) await removeImage(`/uploads/${req.file.filename}`);
    input.respondError(res, err);
  }
});

router.use('/:id', async (req, res, next) => {
  try {
    const vehicle = input.validId(req.params.id) && await Vehicle.findOne({ where: { _id: req.params.id, userId: req.user._id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicule introuvable ou non autorise' });
    req.vehicle = vehicle;
    next();
  } catch (err) { input.respondError(res, err); }
});

router.get('/:id', (req, res) => res.json(req.vehicle));

async function updateVehicle(req, res) {
  let committed = false;
  try {
    const vehicle = req.vehicle;
    const data = vehicleData(req.body);
    const current = req.body.currentOdometer === undefined ? vehicle.currentOdometer : input.number(req.body.currentOdometer, 'Compteur', { nullable: false });
    if (current < (vehicle.currentOdometer || 0)) input.invalid('Le compteur ne peut pas diminuer.');
    const previousImage = vehicle.image;
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    await sequelize.transaction(async transaction => {
      await vehicle.update(data, { transaction });
      await advanceOdometer(vehicle._id, req.user._id, Math.max(current || 0, data.initialKm || 0), transaction);
    });
    committed = true;
    await vehicle.reload();
    if (req.file) await removeImage(previousImage);
    res.json(vehicle);
  } catch (err) {
    if (req.file && !committed) await removeImage(`/uploads/${req.file.filename}`);
    input.respondError(res, err);
  }
}

router.put('/:id', receiveImage, updateVehicle);
router.patch('/:id', receiveImage, updateVehicle);

router.delete('/:id', async (req, res) => {
  try {
    const image = req.vehicle.image;
    // Foreign keys cascade expenses and maintenance in the same database operation.
    await req.vehicle.destroy();
    await removeImage(image);
    res.json({ message: 'Vehicule supprime' });
  } catch (err) { input.respondError(res, err); }
});

module.exports = router;
