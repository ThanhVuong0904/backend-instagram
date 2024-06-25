const router = require("express").Router();

const userRouter = require("./customer");
const authRouter = require("./auth");


router.use("/api/customer", userRouter);
router.use("/api/auth", authRouter);
module.exports = router;
