const mongoose = require('mongoose');
const { Schema } = mongoose;

const revokedTokenSchema = new Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '1d' } // Tokens will automatically be removed after 1 day
});

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);

module.exports = RevokedToken;
