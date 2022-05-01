import CustomError from "./custom-error";
import { StatusCodes } from "http-status-codes";

class InternalServerError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export default InternalServerError;
