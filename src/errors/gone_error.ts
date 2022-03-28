import CustomError from "./custom-error";
import { StatusCodes } from "http-status-codes";

class GoneError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.GONE;
  }
}

export default GoneError;
