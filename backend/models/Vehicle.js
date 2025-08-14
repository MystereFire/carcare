const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    brand: String,
    model: String,
    year: Number,
    plate: String,
    vin: String,
    tankSize: Number,
    image: String,
    initialKm: Number,
    currentOdometer: { type: Number, default: 0 },
    acquisitionDate: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
