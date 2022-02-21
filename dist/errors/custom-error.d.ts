declare class CustomError extends Error {
    statusCode: number;
    constructor(message: string);
}
export default CustomError;
