const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");


const User = new Schema(
    {
        email: { type: String, default: "" },
        password: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);
// Midleware
User.pre("save", async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(this.password, salt);
        this.password = hashPassword;
        next();
    } catch (error) {
        next(error);
    }
});

User.methods.isCheckPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.log(error);
    }
};
User.index({ email: 1 })

module.exports = mongoose.model("User", User);
