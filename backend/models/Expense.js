const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, enum: ['fuel', 'maintenance', 'repair'], required: true },
    label: String,
    amount: Number,
    date: Date,
    km: Number,
    liters: Number,
    notes: String
});

module.exports = mongoose.model('Expense', expenseSchema);
