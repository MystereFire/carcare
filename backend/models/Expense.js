const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 👈 ajouté ici
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, enum: ['fuel', 'maintenance', 'repair'], required: true },
    label: String,
    amount: Number,
    date: Date,
    km: Number,
    liters: Number,
    isFullFill: { type: Boolean, default: false },
    notes: String
});

module.exports = mongoose.model('Expense', expenseSchema);
