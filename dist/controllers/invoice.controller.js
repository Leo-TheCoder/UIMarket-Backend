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
exports.createOrder = exports.preOrder = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
//Checking product is valid or not
const validProduct = (productId, shopId) => __awaiter(void 0, void 0, void 0, function* () {
    let product = yield Product_model_1.default.findOne({
        _id: productId,
        // shopId: shopId,
        productStatus: 1,
    })
        .populate({ path: "shopId", select: "shopName" })
        .select("productPrice productName")
        .lean();
    if (product) {
        return product;
    }
    else {
        return -1;
    }
});
const preOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { productList } = req.body;
    var invoiceTotal = 0;
    if (!productList) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Remove duplicate out of array
    productList = productList.filter((value, index, self) => index ===
        self.findIndex((t) => t.product === value.product && t.shop === value.shop));
    //Checking product and get its price
    for (let i = 0; i < productList.length; i++) {
        var product = yield validProduct(productList[i].product, productList[i].shop);
        if (product.productPrice >= 0) {
            invoiceTotal += product.productPrice;
            productList[i].shopName = product.shopId.shopName;
            productList[i].productName = product.productName;
            productList[i].productPrice = product.productPrice;
        }
        else {
            throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
        }
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({ productList, invoiceTotal });
});
exports.preOrder = preOrder;
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productList } = req.body;
    const { userId } = req.user;
    if (!productList) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Checking transactionId
    //Do sth here
    //Create invoice
    let invoice = yield Invoice_model_1.default.create(Object.assign(Object.assign({}, req.body), { userId: userId }));
    //Increase total sold by 1
    if (invoice) {
        productList.forEach((product) => __awaiter(void 0, void 0, void 0, function* () {
            let result = yield Product_model_1.default.updateOne({ _id: product.product }, { $inc: { totalSold: 1 } });
        }));
    }
    res.status(http_status_codes_1.StatusCodes.CREATED).json({ invoice });
});
exports.createOrder = createOrder;
//# sourceMappingURL=invoice.controller.js.map