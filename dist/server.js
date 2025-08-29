"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
let server;
const port = 5000;
const myage;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(`${process.env.MONGO_LOCAL_URI}`);
    console.log("connect mongodb");
    server = app_1.default.listen(port, () => {
        console.log(`Server is listening to port ${port}`);
    });
});
startServer();
/**
 *  3 type error ----
 *  unhandled rejection error
 *  uncaught rejection error
 *  signal termination sigterm
 */
// error type 1
process.on("unhandledRejection", (error) => {
    console.log("unhandled rejection error detected... server shutting down.", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// error type 2
process.on("uncaughtException", (error) => {
    console.log("uncaught exception detected... server shutting down.", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// error type 3 : when server shutdown beside NET
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received... server shutting down.");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// type 4 shutdown : manually ctrl+c , gracefully shutdown purpose
process.on("SIGINT", () => {
    console.log("SIGINT signal received... server shutting down.");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// Promise.reject(new Error("I forgot to catch this promise")) // error test purpose
// throw new Error("I forgot to handle this local error") // error test purpose
