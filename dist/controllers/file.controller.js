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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadURL = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const s3_1 = require("../utils/s3");
const ErrorMessage = __importStar(require("../errors/error_message"));
//FE Solution
const uploadURL = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const folder = query.folder;
    const isPrivate = query.isPrivate === "true" || false;
    if (!folder || !isPrivate) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const url = yield (0, s3_1.generateUploadURL)(folder, isPrivate).catch((err) => {
        throw new errors_1.CustomError(err.msg);
    });
    if (url) {
        res.status(http_status_codes_1.StatusCodes.OK).send({ url });
    }
});
exports.uploadURL = uploadURL;
//# sourceMappingURL=file.controller.js.map