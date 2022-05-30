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
exports.createReport = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Report_model_1 = __importDefault(require("../models/Report.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const createReport = async (req, res) => {
    const { userId } = req.user;
    const validType = ["Question", "Answer", "Comment", "Product"];
    //Checking body
    if (!req.body.reportObject || !req.body.reason || !req.body.objectType) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    else if (!validType.includes(req.body.objectType)) {
        throw new errors_1.BadRequestError("Valid types are Question, Answer, Comment or Product");
    }
    const report = await Report_model_1.default.create({
        userId: userId,
        ...req.body,
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json(report);
};
exports.createReport = createReport;
//# sourceMappingURL=report.controller.js.map