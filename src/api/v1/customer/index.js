const express = require("express");
const router = express.Router();
const {
    bulkInsert,
    pushNoti,
    list
} = require("./controller");
const verifyToken = require("../../../midlewares/verifyToken");
// const multer = require("../../../midlewares/multer");

router.post("/import", verifyToken, bulkInsert);
router.post("/push-noti", verifyToken, pushNoti);
router.post("/list", verifyToken, list);

module.exports = router;
