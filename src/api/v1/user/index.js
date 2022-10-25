const express = require("express");
const router = express.Router();
const {
    search,
    getUser,
    getFollowing,
    getFollower,
    follow,
    unfollow,
} = require("./controller");
const verifyToken = require("../../../midlewares/verifyToken");

router.get("/", search);
router.get("/me/followings", verifyToken, getFollowing);
router.get("/:username", verifyToken, getUser);
router.get("/me/followers", verifyToken, getFollower);
router.post("/follow/:followId", verifyToken, follow);
router.post("/unfollow/:followId", verifyToken, unfollow);

module.exports = router;
