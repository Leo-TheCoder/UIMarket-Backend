import CustomError from "./custom-error";
import { StatusCodes } from "http-status-codes";

class UnauthenticatedErorr extends CustomError {
    constructor(message: string) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

export default UnauthenticatedErorr;