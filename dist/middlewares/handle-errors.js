"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const errorHandlerMiddleware = (err, req, res, next) => {
    const customError = {
        statusCode: (err === null || err === void 0 ? void 0 : err.statusCode) || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        msg: (err === null || err === void 0 ? void 0 : err.message) || "Something went wrong try again later",
    };
    if (err.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send();
    }
    return res.status(customError.statusCode).json({ msg: customError.msg });
};
exports.default = errorHandlerMiddleware;
//# sourceMappingURL=handle-errors.js.map