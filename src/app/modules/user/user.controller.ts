/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
 
  const payload = await req.body;
  const user = await UserServices.createUser(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Created Successfully",
    data: user,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;

  // const token = req.headers.authorization;
  // const verifiedToken = verifyToken(token as string, envVars.JWT_ACCESS_SECRET) as JwtPayload;

  const verifiedToken = req.user;

  const payload = await req.body;
  const user = await UserServices.updateUser(userId, payload, verifiedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Updated Successfully",
    data: user,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await UserServices.getAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Users Retrieved Successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const decodedToken = req.user as JwtPayload;

  const result = await UserServices.getMe(decodedToken.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your profile Retrieved Successfully",
    data: result.data,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;

  const result = await UserServices.getSingleUser(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Retrieved Successfully",
    data: result.data,
  });
});

export const UserControllers = { createUser, getAllUsers, updateUser, getMe, getSingleUser };

// route matching -> controller -> service -> model -> model -> db
