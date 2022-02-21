import CustomError from "./custom-error";
declare class UnauthenticateErorr extends CustomError {
    constructor(message: string);
}
export default UnauthenticateErorr;
