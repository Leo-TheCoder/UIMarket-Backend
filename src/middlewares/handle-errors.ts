import { StatusCodes } from "http-status-codes";
import { ErrorRequestHandler } from "express";

interface IError {
  statusCode?: number;
  message?: string;
}

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: IError,
  req,
  res,
  next
) => {
  const customError = {
    statusCode: err?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err?.message || "Something went wrong try again later",
  };

  if (err.statusCode === StatusCodes.UNAUTHORIZED) {
    return res.status(StatusCodes.UNAUTHORIZED).json({msg: customError.msg});
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;
