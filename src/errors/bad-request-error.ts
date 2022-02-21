import CustomError from "./custom-error";
import { StatusCodes } from "http-status-codes";

class BadRequestError extends CustomError {
    constructor(message: string) {
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

export default BadRequestError;