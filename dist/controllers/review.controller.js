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
exports.getUserReview = exports.getReviewById = exports.updateReview = exports.getProductReviews = exports.createReview = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
//Model
const Review_model_1 = __importDefault(require("../models/Review.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const ratingProduct = async (productId, rating) => {
    let product = await Product_model_1.default.findById(productId);
    product.productRating =
        (product.productRating * product.totalReview + rating) /
            (product.totalReview + 1);
    product.totalReview += 1;
    const result = await product.save();
    if (result) {
        return 1;
    }
    else {
        return 0;
    }
};
const createReview = async (req, res) => {
    //Checking this invoice is valid or not
    let invoice = await Invoice_model_1.default.findOne({
        _id: req.params.invoiceId,
        invoiceStatus: "Paid",
    });
    if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Checking valid product
    const product = invoice.productList.findIndex((x) => String(x.product) == req.params.productId && x.isReview == 0);
    if (product < 0) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    //Checking user of this review
    const { userId } = req.user;
    if (userId != invoice.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    //Create review
    const review = await Review_model_1.default.create({
        user: userId,
        invoice: req.params.invoiceId,
        product: req.params.productId,
        ...req.body,
    });
    if (review) {
        invoice.productList[product].isReview = 1;
        await invoice.save();
        await ratingProduct(req.params.productId, req.body.productRating);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ review });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.createReview = createReview;
const getProductReviews = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await Review_model_1.default.countDocuments({
        product: req.params.productId,
    });
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const reviews = await Review_model_1.default.find({ product: req.params.productId })
        .skip((page - 1) * limit)
        .limit(limit)
        .select({ invoice: 0 })
        .populate({ path: "user", select: "customerName customerAvatar" })
        .sort({ createdAt: -1 })
        .lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        reviews,
    });
};
exports.getProductReviews = getProductReviews;
const updateReview = async (req, res) => {
    const { userId } = req.user;
    //Checking if this review exist or not
    const review = await Review_model_1.default.findById(req.params.reviewId);
    if (!review) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_REVIEW_ID);
    }
    //Checking if user of this review
    if (userId != review.user) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    //Checking request body
    const newRating = req.body.productRating;
    const newReview = req.body.productReview;
    const newPicture = req.body.reviewPictures;
    if (!newRating || !newReview || !newPicture) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Get product of this review
    const product = await Product_model_1.default.findById(review.product);
    const oldRating = review.productRating;
    //Checking productRating is changed or not
    if (newRating != oldRating) {
        product.productRating =
            product.productRating + (newRating - oldRating) / product.totalSold;
        await product.save();
    }
    //Update review
    review.productReview = newReview;
    review.productRating = newRating;
    review.reviewPictures = newPicture;
    review.updatedAt = new Date();
    const result = await review.save();
    res.status(http_status_codes_1.StatusCodes.OK).json(result);
};
exports.updateReview = updateReview;
const getReviewById = async (req, res) => {
    const review = await Review_model_1.default.findById(req.params.reviewId).lean();
    res.status(http_status_codes_1.StatusCodes.OK).json(review);
};
exports.getReviewById = getReviewById;
const getUserReview = async (req, res) => {
    const { userId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await Review_model_1.default.countDocuments({ user: userId });
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const reviews = await Review_model_1.default.find({ user: userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .select({ invoice: 0 })
        .populate({ path: "user", select: "customerName customerAvatar" })
        .populate({ path: "product", select: "productName" })
        .sort({ createdAt: -1 })
        .lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        reviews,
    });
};
exports.getUserReview = getUserReview;
//# sourceMappingURL=review.controller.js.map