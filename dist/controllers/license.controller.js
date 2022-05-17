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
exports.createLicense = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
//Model
const License_model_1 = __importDefault(require("../models/License.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const createLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking this invoice is valid or not
    const invoice = yield Invoice_model_1.default.findById(req.body.invoice).lean();
    if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Checking valid product
    const product = invoice.productList.find((x) => String(x.product) == String(req.body.product));
    if (!product) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    //Checking license existed or not
    const license = yield License_model_1.default.findOne({
        invoice: req.body.invoice,
        product: req.body.product,
    });
    if (license) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_LICENSE_EXISTED);
    }
    //Create license
    const result = yield License_model_1.default.create(Object.assign(Object.assign({}, req.body), { userId: invoice.userId, boughtTime: invoice.createdAt, shop: product.shop }));
    if (result) {
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.createLicense = createLicense;
//# sourceMappingURL=license.controller.js.map