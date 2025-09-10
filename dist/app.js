"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = require("./app/routes");
const globalErrorhandler_1 = require("./app/middlewares/globalErrorhandler");
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./app/config/passport");
const env_1 = require("./app/config/env");
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({ secret: env_1.envVars.EXPRESS_SESSION_SECRET, resave: false, saveUninitialized: false }));
app.set("trust proxy", 1);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // for from data handling
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND_URL,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Tour Management System Backend",
    });
});
app.use("/api/v1", routes_1.router);
app.use(globalErrorhandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
