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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revoke = exports.refreshAccessToken = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const User_model_1 = __importDefault(require("../models/User.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const JWT_SECRET = process.env.JWT_SECRET;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, refreshToken } = req.body;
    try {
        const opts = {
            ignoreExpiration: true,
        };
        const { userId } = jsonwebtoken_1.default.verify(accessToken, JWT_SECRET, opts);
        const user = yield User_model_1.default.findById(userId);
        const ret = user.compareToken(refreshToken);
        if (ret) {
            const newAccessToken = user.createJWT();
            return res.json({
                accessToken: newAccessToken,
            });
        }
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            msg: ErrorMessage.ERROR_REFRESH_TOKEN_REVOKED,
        });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            msg: ErrorMessage.ERROR_INVALID_ACCESSS_TOKEN,
        });
    }
});
exports.refreshAccessToken = refreshAccessToken;
const revoke = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const user = yield User_model_1.default.findById(userId);
    if (!user) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    user.refreshToken = null;
    yield user.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Revoke successfully!",
    });
});
exports.revoke = revoke;
//# sourceMappingURL=token.controller.js.map