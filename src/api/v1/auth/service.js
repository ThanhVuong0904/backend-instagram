const Validation = require("../../../helpers/validation");
const User = require("../../../model/User");
const RevokeToken = require("../../../model/RevokeToken");
const UserSession = require("../../../model/UserSession");
const { v4: uuidv4 } = require('uuid');

const createError = require("http-errors");
const jwt = require("../../../helpers/jsonwebtoken");
const cloudinary = require("../../../utils/cloudinary");
const RevokedToken = require("../../../model/RevokeToken");

const login = async (req, res, next) => {
    const { email, password } = req.body;
    const deviceInfo = req.header("m-device-info");
    const { error, value, warning } = Validation.userBodyRegister(req.body);

    try {
        if (error) {
            throw next(createError.BadRequest(error.details[0].message));
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw next(createError(409, "User not exists"));
        }

        // Middleware in model
        const isValidPassword = await user.isCheckPassword(password);
        if (!isValidPassword) {
            throw next(createError.Forbidden("Username or password is wrong"));
        }

        // Lấy số lượng phiên hiện tại của người dùng
        const currentSessionsCount = await UserSession.countDocuments({ user_id: user._id.toHexString() });
        const MAX_SESSIONS = process.env.MAX_SESSIONS;  // Số lượng phiên tối đa cho phép
        if (currentSessionsCount >= MAX_SESSIONS) {
            throw next(createError(429, "Maximum number of sessions reached"));
        }

        // const userSessionCount = await UserSession.countDocuments({
        //     user_id: user._id.toHexString(),
        // });

        // if (userSessionCount >= 1) {
        //     const findUserSession = await UserSession.findOneAndDelete({
        //         user_id: user._id,
        //     });

        //     // Add the refresh token to the blacklist
        //     if (findUserSession) {
        //         await RevokedToken.create({ token: findUserSession.access_token });
        //         await RevokedToken.create({ token: findUserSession.refresh_token });
        //     }
        // }

        const sId = uuidv4();
        const { password: hashPassword, ...params } = user._doc;

        const accessToken = await jwt.signAccessToken({
            userId: user._id,
            email: user.email,
            sId: sId
        });

        const refreshToken = await jwt.signRefreshToken({
            userId: user._id,
            email: user.email,
            sId: sId
        });

        await UserSession.insertMany({
            user_id: user._id,
            session_id: sId,
            device_info: deviceInfo,
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        return {
            data: params,
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    } catch (error) {
        next(error);
    }
};


const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { error, value, warning } = Validation.userBodyRegister(req.body);
        if (error) {
            next(createError.BadRequest(error.details[0].message));
        }
        const isUserExists = await User.findOne({ email });
        if (isUserExists) {
            next(createError(409, "User already exists"));
        }
        const username = email.replace("@gmail.com", "");
        const newUser = new User({
            email,
            password,
            username,
        });
        //Not response password
        const user = await newUser.save();
        const { password: hashPassword, ...params } = user._doc;

        const token = await jwt.signAccessToken({
            userId: user._id,
            email: user.email,
        });
        return { data: params, token };
    } catch (error) {
        next(error);
    }
};

const updateCurrentUser = async (req, res, next) => {
    try {
        const { userId } = req.payload;
        if (req.file) {
            const { url } = await cloudinary.upload(req.file);
            newUserUpdate = {
                ...req.body,
                avatar: url,
            };
        }
        const user = await User.findOneAndUpdate(
            { _id: userId },
            { ...newUserUpdate },
            { new: true } // findOneAndUpdate() will instead give you the object after update was applied
        ).select("-password");
        return {
            data: user,
        };
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const { userId } = req.payload;
        const user = await User.findById(userId).select("-password");
        return { data: user };
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // Extract userId and sId from request payload
        const { userId, sId } = req.payload;

        // Find the user session
        const userSession = await UserSession.findOne({
            user_id: userId,
            session_id: sId,
        });

        if (!userSession) {
            throw next(createError.Unauthorized());
        }

        // Revoke both the access token and refresh token
        await RevokedToken.create({ token: userSession.access_token });
        await RevokedToken.create({ token: userSession.refresh_token });

        // Delete the user session
        await UserSession.deleteOne({ _id: userSession._id });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
}


const refreshToken = async (req, res, next) => {
    const { refresh_token } = req.body;
    try {
        if (!refresh_token) {
            throw next(createError.Unauthorized());
        }
        // Check if the refresh token is revoked
        const revokedToken = await RevokedToken.findOne({ token: refresh_token });
        if (revokedToken) {
            throw next(createError.Forbidden());
        }

        // Verify the refresh token
        const payload = await jwt.verifyRefreshToken(refresh_token);

        // Ensure the session exists
        const userSession = await UserSession.findOne({
            user_id: payload.userId,
            refresh_token: refresh_token
        });
        if (!userSession) {
            throw next(createError.Forbidden());
        }

        // Generate new tokens
        const newAccessToken = await jwt.signAccessToken({
            userId: payload.userId,
            email: payload.email,
            sId: payload.sId
        });

        const newRefreshToken = await jwt.signRefreshToken({
            userId: payload.userId,
            email: payload.email,
            sId: payload.sId
        });

        // Update the session with the new refresh token
        userSession.refresh_token = newRefreshToken;
        await userSession.save();

        return {
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        };
    } catch (error) {
        next(error)
    }
};


module.exports = {
    login,
    logout,
    register,
    updateCurrentUser,
    getCurrentUser,
    refreshToken,
};
