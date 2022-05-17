"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const ErrorMessage = __importStar(require("../errors/error_message"));
const errorHandlerMiddleware = (err, req, res, next) => {
    const customError = {
        statusCode: (err === null || err === void 0 ? void 0 : err.statusCode) || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        msg: (err === null || err === void 0 ? void 0 : err.message) || "Something went wrong try again later",
    };
    if (err.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ msg: customError.msg });
    }
    if (err.code === 11000) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            msg: ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE,
            mongooseMsg: err.message,
        });
    }
    if (err.name === "ValidationError") {
        return res
            .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
            .json({ msg: ErrorMessage.ERROR_VALIDATION, mongooseMsg: err.message });
    }
    return res.status(customError.statusCode).json({ msg: customError.msg });
};
exports.default = errorHandlerMiddleware;
//# sourceMappingURL=handle-errors.js.map