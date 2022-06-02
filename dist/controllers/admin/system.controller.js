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
exports.changeSystemFee = exports.getSystemDocument = void 0;
const http_status_codes_1 = require("http-status-codes");
const System_model_1 = __importDefault(require("../../models/System.model"));
const errors_1 = require("../../errors");
const ErrorMessage = __importStar(require("../../errors/error_message"));
let _systemDocument;
const getSystemDocument = async () => {
    if (_systemDocument) {
        return _systemDocument;
    }
    const systemDocuments = await System_model_1.default.find();
    if (!systemDocuments || systemDocuments.length < 1) {
        _systemDocument = new System_model_1.default();
        await _systemDocument.save();
    }
    else {
        _systemDocument = systemDocuments[0];
    }
    return _systemDocument;
};
exports.getSystemDocument = getSystemDocument;
const changeSystemFee = async (req, res) => {
    const systemDocument = await (0, exports.getSystemDocument)();
    const { buyerFee, sellerFee } = req.body;
    if (!buyerFee && !sellerFee) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    if (buyerFee) {
        systemDocument.buyerFee = buyerFee;
    }
    if (sellerFee) {
        systemDocument.sellerFee = sellerFee;
    }
    await systemDocument.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ systemDocument });
};
exports.changeSystemFee = changeSystemFee;
//# sourceMappingURL=system.controller.js.map