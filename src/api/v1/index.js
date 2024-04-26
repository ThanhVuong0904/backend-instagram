const router = require("express").Router();

const userRouter = require("./customer");


router.use("/api/customer", userRouter);
module.exports = router;
