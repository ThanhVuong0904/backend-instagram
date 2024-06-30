const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");


const UserSession = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to User collection
        device_info: {},
        session_id: { type: String },
        access_token: { type: String },
        refresh_token: { type: String },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("UserSession", UserSession);
