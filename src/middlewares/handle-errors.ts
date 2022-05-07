import { StatusCodes } from "http-status-codes";
import { ErrorRequestHandler } from "express";
import { BadRequestError } from "../errors";
import * as ErrorMessage from "../errors/error_message";

interface IError {
  statusCode?: number;
  message?: string;
  code?: number;
  name?: string;
}

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: IError,
  req,
  res,
  next,
) => {
  const customError = {
    statusCode: err?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err?.message || "Something went wrong try again later",
  };

  if (err.statusCode === StatusCodes.UNAUTHORIZED) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: customError.msg });
  }

  if (err.code === 11000) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({
        msg: ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE,
        mongooseMsg: err.message,
      });
  }

  if (err.name === "ValidationError") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: ErrorMessage.ERROR_VALIDATION, mongooseMsg: err.message });
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;
