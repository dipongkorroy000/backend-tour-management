import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;

      if (!accessToken) {
        throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");
      }

      //   const verifiedToken = jwt.verify(accessToken, "secret");
      const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;

      if (!verifiedToken) {
        throw new AppError(httpStatus.BAD_REQUEST, `Your are not authorized ${verifiedToken}`);
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(httpStatus.METHOD_NOT_ALLOWED, "Your are not permitted to view this route!!!");
      }

      req.user = verifiedToken;

      next();
    } catch (err) {
      next(err);
    }
  };