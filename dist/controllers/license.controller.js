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
exports.getLicenseById = exports.getLicenseList = exports.createLicense = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
//Model
const License_model_1 = __importDefault(require("../models/License.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const createLicense = async (req, res) => {
    //Checking body
    if (!req.body.invoice || !req.body.product || !req.body.licenseFile) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Checking this invoice is valid or not
    const invoice = await Invoice_model_1.default.findOne({
        _id: req.body.invoice,
        invoiceStatus: "Paid",
    }).lean();
    if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Checking valid product
    const product = invoice.productList.find((x) => String(x.product) == String(req.body.product));
    if (!product) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    //Checking license existed or not
    const license = await License_model_1.default.findOne({
        ...req.body,
    });
    if (license) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_LICENSE_EXISTED);
    }
    //Create license
    const result = await License_model_1.default.create({
        ...req.body,
        userId: invoice.userId,
        boughtTime: invoice.createdAt,
        shop: product.shop,
    });
    if (result) {
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.createLicense = createLicense;
const getLicenseList = async (req, res) => {
    const { userId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    //Get total product
    const total = await License_model_1.default.countDocuments({ userId: userId });
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const licenses = await License_model_1.default.find({ userId: userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "product", select: "productName" })
        .populate({ path: "userId", select: "customerName customerEmail" })
        .lean();
    res.status(http_status_codes_1.StatusCodes.OK).json({ totalPages, page, limit, licenses });
};
exports.getLicenseList = getLicenseList;
const getLicenseById = async (req, res) => {
    const { userId } = req.user;
    const license = await License_model_1.default.findOne({
        _id: req.params.licenseId,
        userId,
    })
        .populate({ path: "product", select: "productName" })
        .populate({ path: "userId", select: "customerName customerEmail" })
        .populate({ path: "shop", select: "shopName" })
        .lean();
    if (!license) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_LICENSE_ID);
    }
    res.status(http_status_codes_1.StatusCodes.OK).json(license);
};
exports.getLicenseById = getLicenseById;
//# sourceMappingURL=license.controller.js.map