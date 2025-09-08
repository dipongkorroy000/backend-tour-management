import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // const loginInfo = await AuthServices.credentialsLogin(req.body);

  passport.authenticate("local", async (err: any, user: any, info: any) => {
    if (err) return next(new AppError(401, err));
    if (!user) return next(new AppError(401, info.message));

    const userTokens = createUserTokens(user);

    // delete user.toObject().password;
    // alternative
    const { password: pass, ...rest } = user.toObject();

    setAuthCookie(res, userTokens);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login Successfully",
      data: { accessToken: userTokens.accessToken, refreshToken: userTokens.refreshToken, user: rest },
    });
  })(req, res, next);
});

const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) throw new AppError(httpStatus.BAD_REQUEST, "No refresh token received from cookie");

  const tokenInfo = await AuthServices.getNewAccessToken(refreshToken as string);

  setAuthCookie(res, tokenInfo);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "New Access Token Retrieved Successfully",
    data: tokenInfo,
  });
});

const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie("accessToken", { httpOnly: true, secure: false, sameSite: "lax" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: false, sameSite: "lax" });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logout Successfully",
    data: null,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const oldPassword = req.body.oldPassword;

  const newPassword = req.body.newPassword;

  const decodedToken = req.user;

  await AuthServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "Password Updated Successfully",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const oldPassword = req.body.oldPassword;

  const newPassword = req.body.newPassword;

  const decodedToken = req.user;

  await AuthServices.resetPassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "Password Updated Successfully",
    data: null,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const decodedToken = req.user as JwtPayload;
  const { password } = req.body;

  await AuthServices.setPassword(decodedToken.userId, password);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password Updated Successfully",
    data: null,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  // console.log( "user", user,)

  // booking -> booking -> "/" ->
  let redirectTo = req.query.state ? (req.query.state as string) : "/";
  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.slice(1);
  }

  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User Not Found");

  const tokenInfo = createUserTokens(user);

  setAuthCookie(res, tokenInfo);

  res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
});

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,
  resetPassword,
  setPassword,
  googleCallback,
};
