const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const Customer = new Schema(
    {
        full_name: { type: String, default: "" },
        phone_number: { type: String, default: "" },
        provider_phone_number: { type: String, default: "" },
        provider_code_phone_number: { type: String, default: "" },
        contact_date: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

Customer.index({ provider_code_phone_number: 1, createdAt: 1 })

module.exports = mongoose.model("Customer", Customer);
