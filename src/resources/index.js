const configs = require("../configs");
const connectMongoDB = require("./mongoose");
const logger = require("../utils/logger");

module.exports = async () => {
    if (configs.mongodb.uri) {
        await connectMongoDB();
    }

};
