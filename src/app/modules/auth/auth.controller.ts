import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const loginInfo = await AuthServices.credentialsLogin(req.body);

  res.cookie("refreshToken", loginInfo.refreshToken, { httpOnly: true, secure: false });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Login Successfully",
    data: loginInfo,
  });
});

const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, "No refresh token received from cookie");
  }

  const tokenInfo = await AuthServices.getNewAccessToken(refreshToken as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Login Successfully",
    data: tokenInfo,
  });
});

export const AuthControllers = { credentialsLogin, getNewAccessToken };
