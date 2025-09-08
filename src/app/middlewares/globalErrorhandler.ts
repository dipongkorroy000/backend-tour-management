import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { handlerDuplicateError } from "../helpers/handlerDuplicateError";
import { handlerCastError } from "../helpers/handlerCastError";
import { handleValidationError } from "../helpers/handleValidationError";
import { handleZodError } from "../helpers/handleZodError";
import { deleteImageFromCLoudinary } from "../config/cloudinary.config";

export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  // if (envVars.NODE_ENV === "development") {
  //   console.log(err);
  // }

  let errorSources: any = [
    // {
    //   path: "isDeleted",
    //   message: "Cast Failed ",
    // },
  ];
  let statusCode = 500;
  let message = `Something Went Wrong! ${err.message}`;

  if (req.file) {
    await deleteImageFromCLoudinary(req.file.path);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = (req.files as Express.Multer.File[]).map((file) => file.path);

    await Promise.all(imageUrls.map((url) => deleteImageFromCLoudinary(url)));
  }

  if (err.code === 11000) {
    // duplicated error
    const simplifiedError = handlerDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    // -----
  } else if (err.name === "CastError") {
    // object id error / cast error
    const simplifiedError = handlerCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    // -----
  } else if (err.name === "ValidationError") {
    // validation error

    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    // -----
  } else if (err.name === "ZodError") {
    const simplifiedError = handleZodError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
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
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
