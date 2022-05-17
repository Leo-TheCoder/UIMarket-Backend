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
exports.optionalAuth = exports.compulsoryAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const compulsoryAuth = (req, res, next) => {
    //check header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: payload.userId,
            shopId: payload.shopId,
            name: payload.name,
            isActive: payload.isActive,
        };
        next();
    }
    catch (error) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_EXPIRED);
    }
};
exports.compulsoryAuth = compulsoryAuth;
const optionalAuth = (req, res, next) => {
    //check header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        req.user = undefined;
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: payload.userId,
            shopId: payload.shopId,
            name: payload.name,
            isActive: payload.isActive,
        };
        next();
    }
    catch (error) {
        req.user = undefined;
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authentication.js.map