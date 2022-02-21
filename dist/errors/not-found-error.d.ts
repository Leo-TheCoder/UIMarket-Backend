import CustomError from "./custom-error";
declare class NotFoundError extends CustomError {
    constructor(message: string);
}
export default NotFoundError;
