const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const CustomerMessage = new Schema(
    {
        date_time: { type: Date },
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
        phone_number: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);

CustomerMessage.index({ customer_id: 1, createdAt: 1 })

module.exports = mongoose.model("Customer_Message", CustomerMessage);
