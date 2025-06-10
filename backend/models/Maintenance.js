const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
    type: String,
    date: Date,
    mileage: Number,
    cost: Number,
    garage: String,
    notes: String
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
