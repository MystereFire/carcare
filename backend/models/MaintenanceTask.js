const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  title: { type: String, required: true },
  notes: String,
  intervalKm: Number,
  intervalDays: Number,
  lastDoneKm: Number,
  lastDoneDate: Date,
  inspectionDate: Date,
  isInspection: { type: Boolean, default: false },
  nextAtKm: Number,
  nextAtDate: Date,
  status: { type: String, enum: ['OK', 'SOON', 'DUE'], default: 'OK', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

maintenanceTaskSchema.index({ userId: 1, vehicleId: 1, title: 1 }, { unique: false });

maintenanceTaskSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  try {
    const Vehicle = mongoose.model('Vehicle');
    const { computeNext, getAvgKmPerDay } = require('../services/maintenanceService');
    const vehicle = await Vehicle.findById(this.vehicleId);
    const avg = await getAvgKmPerDay(this.vehicleId);
    const updated = computeNext(this, vehicle || {}, avg);
    this.nextAtKm = updated.nextAtKm;
    this.nextAtDate = updated.nextAtDate;
    this.status = updated.status;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('MaintenanceTask', maintenanceTaskSchema);
