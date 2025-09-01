import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import statusCodes from "http-status-codes";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorSources: any = [
    // {
    //   path: "isDeleted",
    //   message: "Cast Failed ",
    // },
  ];
  let statusCode = 500;
  let message = `Something Went Wrong! ${err.message}`;

  // console.log(err);

  if (err.code === 11000) {
    // duplicated error
    statusCode = statusCodes.BAD_REQUEST;
    const matchedArray = err.message.match(/"([^"]*)"/);
    message = `${matchedArray[1]} Already Exist!!`;
    // -----
  } else if (err.name === "CastError") {
    // object id error / cast error
    statusCode = 400;
    message = "Invalid MongoDB objectId. Please provide a valid ObjectId";
    // -----
  } else if (err.name === "ValidationError") {
    // validation error
    statusCode = statusCodes.BAD_REQUEST;
    const errorsArray = Object.values(err.errors);

    errorsArray.forEach((errorObj: any) => errorSources.push({ path: errorObj.path, message: errorObj.message }));

    message = "Validation Error";
    // -----
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    // -----
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
