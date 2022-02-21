import CustomError from "./custom-error";
import { StatusCodes } from "http-status-codes";

class UnauthenticateErorr extends CustomError {
    constructor(message: string) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

export default UnauthenticateErorr;