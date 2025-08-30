import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";

// const createUserFunction = async (req: Request, res: Response) => {
//   const user = await UserServices.createUser(req.body);
//   res.status(httpStatus.CREATED).json({success: true, message: "User created Successfully", user})
// }

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserServices.createUser(req.body);
  res.status(httpStatus.CREATED).json({ success: true, message: "User created Successfully", data: user });
});

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const users = await UserServices.getAllUsers();
  res.status(httpStatus.OK).json({ success: true, message: "All Users Retrieved Successfully", data: users });
});

export const UserControllers = { createUser, getAllUsers };

// route matching -> controller -> service -> model -> model -> db
