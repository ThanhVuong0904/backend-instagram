const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const signAccessToken = async (data) => {
    return new Promise((resolve, reject) => {
        const options = {
            expiresIn: "1m",
        };
        jwt.sign(data, ACCESS_TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
    });
};

const verifyAccessToken = async (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
};



const signRefreshToken = async (data) => {
    return new Promise((resolve, reject) => {
        const options = {
            expiresIn: "1d",
        };
        jwt.sign(data, REFRESH_TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
    });
};

const verifyRefreshToken = async (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, REFRESH_TOKEN_SECRET, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
};

module.exports = {
    signAccessToken: signAccessToken,
    verifyAccessToken: verifyAccessToken,
    signRefreshToken: signRefreshToken,
    verifyRefreshToken: verifyRefreshToken,
};
