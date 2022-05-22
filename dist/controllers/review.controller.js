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
exports.createReview = void 0;
const http_status_codes_1 = require("http-status-codes");
const Review_model_1 = __importDefault(require("../models/Review.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const ratingProduct = (productId, rating) => __awaiter(void 0, void 0, void 0, function* () {
    let product = yield Product_model_1.default.findById(productId);
    product.productRating =
        (product.productRating * product.totalReview + rating) /
            (product.totalReview + 1);
    product.totalReview += 1;
    const result = yield product.save();
    if (result) {
        return 1;
    }
    else {
        return 0;
    }
});
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking this invoice is valid or not
    let invoice = yield Invoice_model_1.default.findOne({
        _id: req.params.invoiceId,
        // "productList.productId": req.params.productId,
    });
    if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Checking valid product
    const product = invoice.productList.findIndex((x) => String(x.product) == req.params.productId && x.isReview == 0);
    if (!product) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    //Checking user of this review
    const { userId } = req.user;
    if (userId != invoice.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    //Create review
    const review = yield Review_model_1.default.create(Object.assign({ user: userId, invoice: req.params.invoiceId, product: req.params.productId }, req.body));
    if (review) {
        invoice.productList[product].isReview = 1;
        yield invoice.save();
        yield ratingProduct(req.params.productId, req.body.productRating);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ review });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
    // //Remove duplicate productId
    // const seen = new Set();
    // const filteredArr = productListReq.filter((el: any) => {
    //   const duplicate = seen.has(el.productId);
    //   seen.add(el.productId);
    //   return !duplicate;
    // });
});
exports.createReview = createReview;
//# sourceMappingURL=review.controller.js.map