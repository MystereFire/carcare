const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: {
        type: String,
        required: function() {
            return this.provider !== 'google';
        }
    },
    name: String,
    provider: { type: String, default: 'local' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
