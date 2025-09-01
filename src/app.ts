import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorhandler";
import notFound from "./app/middlewares/notFound";
import passport from "passport";
import expressSession from "express-session";
import "./app/config/passport";

const app: Application = express();
app.use(expressSession({ secret: "Your secret", resave: false, saveUninitialized: false }));

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Tour Management System Backend",
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
