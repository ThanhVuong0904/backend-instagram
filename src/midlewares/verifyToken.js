const jwt = require("../helpers/jsonwebtoken");
const createError = require("http-errors");
const RevokedToken = require('../model/RevokeToken'); // Adjust the path according to your project structure
const UserSession = require('../model/UserSession'); // Adjust the path according to your project structure
const { ObjectId } = require("mongodb");

const verifyToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    const token = authHeader && authHeader.split(" ")[1];
    if (!token || token === "undefined") {
        return next(new createError.Unauthorized());
    }

    try {
        const t = Date.now();
        const revokedToken = await RevokedToken.findOne({ token }).lean();
        console.log("revokedToken time elapsed", Date.now() - t, "ms");
        if (revokedToken) {
            throw next(new createError.Unauthorized());
        }
        const verify = await jwt.verifyAccessToken(token);
        if (verify) {
            if (verify.error) {
                throw next(new createError.Unauthorized(verify.error.message));
            }
            req.payload = verify;
        }
        // Kiểm tra xem session có tồn tại không
        const userSession = await UserSession.findOne({
            user_id: ObjectId(req.payload.userId),
            session_id: req.payload.sId,
        }).lean().select("_id");
        console.log("userSession time elapsed", Date.now() - t, "ms");
        if (!userSession) {
            throw new createError.Unauthorized('Session does not exist');
        }
    } catch (error) {
        next(new createError.Unauthorized());
    }

    next();
};

module.exports = verifyToken;
