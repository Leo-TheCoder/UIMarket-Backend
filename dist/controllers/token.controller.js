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
const refreshAccessToken = async (req, res) => {
    const { accessToken, refreshToken } = req.body;
    try {
        const opts = {
            ignoreExpiration: true,
        };
        const { userId } = jsonwebtoken_1.default.verify(accessToken, JWT_SECRET, opts);
        const user = await User_model_1.default.findById(userId);
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
};
exports.refreshAccessToken = refreshAccessToken;
const revoke = async (req, res) => {
    const { userId } = req.user;
    const user = await User_model_1.default.findById(userId);
    if (!user) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    user.refreshToken = null;
    await user.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Revoke successfully!",
    });
};
exports.revoke = revoke;
//# sourceMappingURL=token.controller.js.map