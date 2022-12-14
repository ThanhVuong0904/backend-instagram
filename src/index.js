const configs = require("./configs");

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const createError = require("http-errors");

const initializeResources = require("./resources");
const errorHandler = require("./midlewares/errorHandle");
const logger = require("./utils/logger");

const app = express();

const routes = require("./api");

app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(routes);

//Handle route
app.use((req, res, next) => {
    next(
        createError.NotFound(
            "This page not found and Wellcome to Thanh Vương ❤❤❤"
        )
    );
});

app.use(errorHandler);

const PORT = configs.port || 8000;
const listen = async () => {
    await initializeResources();
    app.listen(PORT, () => {
        logger.info(`=================================`);
        logger.info(
            `🚀 ⚡️[server]: Server is running at http://localhost:${PORT}`
        );
        logger.info(`=================================`);
        console.log(
            `🚀 ⚡️[server]: Server is running at http://localhost:${PORT}`
        );
    });
};

listen();
