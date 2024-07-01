const express = require("express");
const router = express.Router();
const {
    bulkInsert,
    pushNoti,
    list,
    listV2,
} = require("./controller");
const verifyToken = require("../../../midlewares/verifyToken");
// const multer = require("../../../midlewares/multer");

router.post("/import", verifyToken, bulkInsert);
router.post("/push-noti", verifyToken, pushNoti);
router.post("/list", verifyToken, list);
router.post("/listV2", listV2);

module.exports = router;
