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
exports.generatedownloadURL = exports.uploadURL = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const s3_1 = require("../utils/s3");
const ErrorMessage = __importStar(require("../errors/error_message"));
//FE Solution
const uploadURL = async (req, res) => {
    const query = req.query;
    const folder = query.folder;
    const isPrivate = query.isPrivate === "true" || false;
    if (!folder || !query.isPrivate) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const url = await (0, s3_1.generateUploadURL)(folder, isPrivate).catch((err) => {
        throw new errors_1.CustomError(err.msg);
    });
    if (url) {
        res.status(http_status_codes_1.StatusCodes.OK).send({ url });
    }
};
exports.uploadURL = uploadURL;
const generatedownloadURL = async (req, res) => {
    const query = req.query;
    const folder = query.folder;
    const isPrivate = query.isPrivate === "true" || false;
    if (!folder || !query.isPrivate) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const url = await (0, s3_1.downloadURL)(folder, isPrivate);
    if (url) {
        res.status(http_status_codes_1.StatusCodes.OK).send({ url });
    }
};
exports.generatedownloadURL = generatedownloadURL;
//# sourceMappingURL=file.controller.js.map