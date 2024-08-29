const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSession = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to User collection
        device_info: {},
        session_id: { type: String },
        access_token: { type: String },
        refresh_token: { type: String },
        expires_at: { type: Date }, // Field for TTL
    },
    {
        timestamps: true,
    }
);
UserSession.index({ user_id: 1, session_id: 1 })
// Set the TTL index on the 'expiresAt' field
UserSession.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("UserSession", UserSession);
