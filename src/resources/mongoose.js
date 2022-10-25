const { connect, connection } = require("mongoose");
const configs = require("../configs");
const logger = require("../utils/logger");

module.exports = async () => {
    try {
        const URI = configs.mongodb.uri;
        await connect(URI);

        connection.on("connected", function () {
            logger.info("MongoDB::: Successfully connected to MongoDB");
        });

        connection.on("disconnected", function () {
            logger.info(`\nMongoDB::: Disconnected`);
        });

        connection.on("error", (error) => {
            logger.error(
                "MongoDB::: Connection error::::",
                JSON.stringify(error)
            );
        });

        logger.info("Successfully connected to MongoDB");
    } catch (error) {
        logger.error(`MongoDB::: Error in tryCatch::: ${error}`);
    }
};
