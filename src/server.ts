/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.MONGO_URI);

    console.log("connected to mongodb");

    server = app.listen(envVars.PROT, () => {
      console.log(`Server is listening to port ${envVars.PROT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await connectRedis();
  await startServer();
  await seedSuperAdmin();
})();

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
