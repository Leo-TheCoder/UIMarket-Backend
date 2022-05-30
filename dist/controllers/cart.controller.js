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
exports.removeFromCart = exports.viewCart = exports.addProduct = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
//Model
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const addProduct = async (req, res) => {
    const { userId } = req.user;
    const productId = req.body.product;
    if (!productId) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Checking valid product
    const product = await Product_model_1.default.find({
        _id: productId,
        productStatus: 1,
    }).lean();
    if (!product) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    //Checking if this product in cart or not
    const oldCart = await Cart_model_1.default.findOne({
        userId: userId,
        product: productId,
    });
    if (oldCart) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE);
    }
    const cart = await Cart_model_1.default.create({
        ...req.body,
        userId: userId,
    });
    if (cart) {
        res.status(http_status_codes_1.StatusCodes.CREATED).json(cart);
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.addProduct = addProduct;
const viewCart = async (req, res) => {
    const { userId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await Cart_model_1.default.countDocuments({ userId: userId }).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const cart = await Cart_model_1.default.find({ userId: userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
        path: "product",
        select: ["productName", "productPrice", "productPictures", "shopId"],
    })
        .lean();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        cart,
    });
};
exports.viewCart = viewCart;
const removeFromCart = async (req, res) => {
    const { userId } = req.user;
    const cart = await Cart_model_1.default.findOneAndRemove({
        userId: userId,
        product: req.params.productId,
    });
    if (cart) {
        res.status(http_status_codes_1.StatusCodes.OK).json(cart);
    }
    else {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
};
exports.removeFromCart = removeFromCart;
//# sourceMappingURL=cart.controller.js.map