const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowSchema = new Schema(
    {
        followId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        }, // As A
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" }, // As B => B is following A

        // 6328c3e40b57259114f888a0(Lisa) follow thang 6327e22dfb5675d0cda5079c(Jennie)
    },
    { timestamps: true }
);

module.exports = mongoose.model("Follow", FollowSchema);
