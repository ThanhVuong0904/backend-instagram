const express = require("express");
const verifyToken = require("../../../midlewares/verifyToken");
const router = express.Router();
const multer = require("../../../midlewares/multer");

const {
    getCurrentUser,
    login,
    logout,
    register,
    updateCurrentUser,
    refreshToken,
} = require("./controller");

router.get("/me", verifyToken, getCurrentUser);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/register", register);
router.post("/refreshToken", refreshToken);
router.patch(
    "/me",
    verifyToken,
    multer.upload.single("avatar"),
    updateCurrentUser
);

module.exports = router;
