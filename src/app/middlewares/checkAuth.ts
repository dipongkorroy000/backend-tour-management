import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;
      if (!accessToken) throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");

      //   const verifiedToken = jwt.verify(accessToken, "secret");
      const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;
      if (!verifiedToken) throw new AppError(httpStatus.BAD_REQUEST, `Your are not authorized ${verifiedToken}`);

      const isUserExist = await User.findOne({ email: verifiedToken.email });
      if (!isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");

      if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`);
      }

      if (isUserExist.isDeleted) throw new AppError(httpStatus.BAD_REQUEST, "User is Deleted");
      if (!isUserExist.isVerified) throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");

      if (!authRoles.includes(verifiedToken.role))
        throw new AppError(httpStatus.METHOD_NOT_ALLOWED, "Your are not permitted to view this route!!!");

      req.user = verifiedToken;

      next();
    } catch (err) {
      next(err);
    }
  };
