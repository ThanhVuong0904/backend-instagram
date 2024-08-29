const mongoose = require('mongoose');
const { Schema } = mongoose;

const revokedTokenSchema = new Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '1d' },// Tokens will automatically be removed after 1 day
    expires_at: { type: Date }, // Field for TTL,
});

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);

revokedTokenSchema.index({ token: 1, createdAt: 1 })
// Set the TTL index on the 'expiresAt' field
revokedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
module.exports = RevokedToken;
