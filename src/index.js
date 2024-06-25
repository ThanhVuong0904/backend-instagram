const configs = require("./configs");

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const createError = require("http-errors");

const initializeResources = require("./resources");
const errorHandler = require("./midlewares/errorHandle");
const logger = require("./utils/logger");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit"); // Thêm thư viện rate limit


const app = express();

const routes = require("./api");

// Thêm middleware rate limit
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100, // Giới hạn mỗi IP chỉ được gọi API 100 lần trong 1 phút
    message: "Too many requests from this IP, please try again later",
});
app.use(limiter); // Áp dụng rate limit cho toàn bộ ứng dụng
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));
app.use(routes);

app.get('/healthz', (req, res) => {
    res.status(200).send('ok');
});

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
const createServer = async () => {
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

// listen();
module.exports = {
    createServer,
};
