import CustomError from "./custom-error";
declare class BadRequestError extends CustomError {
    constructor(message: string);
}
export default BadRequestError;
