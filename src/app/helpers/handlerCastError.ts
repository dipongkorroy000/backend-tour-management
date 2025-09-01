import mongoose from "mongoose";
import { TGenericErrorResponse } from "../interfaces/error.types";

export const handlerCastError = (err: mongoose.Error.CastError): TGenericErrorResponse => {
  return {
    statusCode: 400,
    message: `Invalid MongoDB objectId. Please provide a valid ObjectId. ${err.name}`,
  };
};