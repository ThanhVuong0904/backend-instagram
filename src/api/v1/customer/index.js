const express = require("express");
const router = express.Router();
const {
    bulkInsert,
    pushNoti,
    list
} = require("./controller");
// const verifyToken = require("../../../midlewares/verifyToken");
// const multer = require("../../../midlewares/multer");

router.post("/import", bulkInsert);
router.post("/push-noti", pushNoti);
router.post("/list", list);

module.exports = router;
