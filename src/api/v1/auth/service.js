const Validation = require("../../../helpers/validation");
const User = require("../../../model/User");
const UserSession = require("../../../model/UserSession");
const { v4: uuidv4 } = require('uuid');

const createError = require("http-errors");
const jwt = require("../../../helpers/jsonwebtoken");
const cloudinary = require("../../../utils/cloudinary");

const login = async (req, res, next) => {
    const { email, password } = req.body;
    const deviceInfo = req.header("m-device-info");
    console.log(deviceInfo)
    const { error, value, warning } = Validation.userBodyRegister(req.body);

    try {
        if (error) {
            throw next(createError.BadRequest(error.details[0].message));
        }
        const user = await User.findOne({ email });
        if (!user) {
            throw next(createError(409, "User not exists"));
        }
        //Midleware in model
        const isValidPassword = await user.isCheckPassword(password);
        if (!isValidPassword) {
            throw next(createError.Forbidden("Username or password is wrong"));
        }

        const userSessionCount = await UserSession.count({
            user_id: user._id.toHexString(),
        });
        if (userSessionCount >= 1) {
            throw next(createError(409, "User max login 1 device"));
        }
        const sId = uuidv4()

        await UserSession.insertMany({
            user_id: user._id,
            session_id: sId,
            device_info: deviceInfo,
        })


        const { password: hashPassword, ...params } = user._doc;

        const token = await jwt.sign({
            userId: user._id,
            email: user.email,
            sId: sId
        });
        return { data: params, token };
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { error, value, warning } = Validation.userBodyRegister(req.body);
        if (error) {
            throw next(createError.BadRequest(error.details[0].message));
        }
        const isUserExists = await User.findOne({ email });
        if (isUserExists) {
            throw next(createError(409, "User already exists"));
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

        const token = await jwt.sign({
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
        const { userId, sId } = req.payload;
        await UserSession.deleteMany({
            user_id: userId,
            session_id: sId,
        });
        return { data: {} };
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    logout,
    register,
    updateCurrentUser,
    getCurrentUser,
};
