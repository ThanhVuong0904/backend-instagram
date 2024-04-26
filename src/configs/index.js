const dotenv = require("dotenv");
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
dotenv.config({ path: `.env.development` });

console.log(process.env.NODE_ENV);
dotenv.config()
module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodb: {
        uri: process.env.MONGODB_URI,
        db_name: process.env.MONGODB_DB_NAME,
    },
    jwt: {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    },
    cloudinary: {
        cloudName: process.env.CLOUD_NAME,
        apiKey: process.env.CLOUD_API_KEY,
        apiSecret: process.env.CLOUD_API_SECRET,
    },
};
