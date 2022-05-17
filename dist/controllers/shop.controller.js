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
exports.getProductStatistic = exports.activeProduct = exports.deactiveProduct = exports.getShopByName = exports.getShopById = exports.updateShop = exports.getAllProduct = exports.updateProduct = exports.deleteProduct = exports.uploadProduct = exports.createShop = void 0;
const http_status_codes_1 = require("http-status-codes");
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const Constants = __importStar(require("../constants"));
const Shop_model_2 = __importDefault(require("../models/Shop.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const createShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const shop = yield Shop_model_1.default.findOne({ userId: userId }).lean();
    if (shop) {
        if (shop.shopStatus == 0) {
            throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
        }
        else {
            throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
        }
    }
    const newShop = yield Shop_model_2.default.create(Object.assign(Object.assign({}, req.body), { userId: userId }));
    if (newShop) {
        const user = yield User_model_1.default.findByIdAndUpdate(userId, { shopId: newShop._id }, { new: true });
        const token = user.createJWT();
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ newShop, token });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.createShop = createShop;
const uploadProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const { productCategory } = req.body;
    if (!productCategory) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const category = yield Category_model_1.default.findById(productCategory);
    if (!category) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_CATEGORY_ID);
    }
    const product = yield Product_model_1.default.create(Object.assign(Object.assign({}, req.body), { shopId: shopId }));
    if (product) {
        category.totalProduct += 1;
        yield category.save();
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ product });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.uploadProduct = uploadProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    const product = yield Product_model_1.default.findOne({ _id: req.params.productId });
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    else if (!product) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    else if (shopId != product.shopId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (product.deleteFlagged == 1) {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
    product.productStatus = 0;
    product.deleteFlagged = 1;
    product.updatedAt = new Date();
    const result = yield product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.deleteProduct = deleteProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    const product = yield Product_model_1.default.findOne({
        _id: req.params.productId,
        productStatus: 1,
    });
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    else if (!product) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    else if (shopId != product.shopId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    product.productName = req.body.productName || product.productName;
    product.productPrice = req.body.productPrice || product.productPrice;
    product.productDescription =
        req.body.productDescription || product.productDescription;
    product.productPicture = req.body.productPicture || product.productPicture;
    product.updatedAt = new Date();
    const result = yield product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.updateProduct = updateProduct;
const getAllProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const products = yield Product_model_1.default
        //
        .find({ shopId: shopId })
        .populate({ path: "productCategory", select: ["categoryName"] })
        .lean();
    res.status(http_status_codes_1.StatusCodes.OK).json({ products });
});
exports.getAllProduct = getAllProduct;
const updateShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const shop = yield Shop_model_2.default.findOne({ _id: shopId, shopStatus: 1 });
    shop.shopDescription = req.body.shopDescription || shop.shopDescription;
    shop.shopPhone = req.body.shopPhone || shop.shopPhone;
    shop.shopEmail = req.body.shopEmail || shop.shopEmail;
    shop.updatedAt = new Date();
    const result = yield shop.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.updateShop = updateShop;
const getShopById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var selectOption = { __v: 0 };
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.shopId) || req.user.shopId != req.params.shopId) {
        selectOption.shopIDCard = 0;
        selectOption.shopBalance = 0;
        selectOption.userId = 0;
        selectOption.taxCode = 0;
    }
    const shop = yield Shop_model_2.default.find({
        _id: req.params.shopId,
        shopStatus: 1,
    })
        .select(selectOption)
        .lean();
    if (!shop) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    else {
        res.status(http_status_codes_1.StatusCodes.OK).json({ shop });
    }
});
exports.getShopById = getShopById;
const getShopByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const selectOption = {
        __v: 0,
        shopIDCard: 0,
        shopBalance: 0,
        userId: 0,
        taxCode: 0,
    };
    const totalShop = yield Shop_model_2.default.aggregate([
        {
            $search: {
                index: "shopName",
                text: {
                    path: "shopName",
                    query: decodeURIComponent(req.params.shopName),
                },
            },
        },
        { $match: { shopStatus: 1 } },
        { $count: "total" },
    ]);
    if (totalShop.length < 1) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            totalPages: 0,
            page,
            limit,
            shops: [],
        });
    }
    const total = totalShop[0].total;
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const shops = yield Shop_model_2.default.aggregate([
        {
            $search: {
                index: "shopName",
                text: {
                    path: "shopName",
                    query: decodeURIComponent(req.params.shopName),
                },
            },
        },
        { $match: { shopStatus: 1 } },
        { $addFields: { score: { $meta: "searchScore" } } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: selectOption },
    ]);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        shops,
    });
});
exports.getShopByName = getShopByName;
const deactiveProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    const product = yield Product_model_1.default.findOne({
        _id: req.params.productId,
        deleteFlagged: 0,
    });
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    else if (!product) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    else if (shopId != product.shopId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (product.productStatus == 0) {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
    product.productStatus = 0;
    product.updatedAt = new Date();
    const result = yield product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.deactiveProduct = deactiveProduct;
const activeProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.user;
    const product = yield Product_model_1.default.findOne({
        _id: req.params.productId,
        deleteFlagged: 0,
    });
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    else if (!product) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    else if (shopId != product.shopId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (product.productStatus == 1) {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
    product.productStatus = 1;
    product.updatedAt = new Date();
    const result = yield product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.activeProduct = activeProduct;
const getRevenue = (invoices, productId) => __awaiter(void 0, void 0, void 0, function* () {
    var revenue = 0;
    for (let i = 0; i < invoices.length; i++) {
        var product = invoices[i].productList.find((x) => String(x.product) == String(productId));
        revenue += product.productPrice;
    }
    return revenue;
});
const getProductStatistic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Get list of products
    const products = yield Product_model_1.default.find({
        shopId: req.user.shopId,
        deleteFlagged: 0,
    }).select({ productFile: 0, deleteFlagged: 0, __v: 0 });
    const today = new Date();
    let L30D = new Date(today.getTime());
    L30D.setDate(L30D.getDate() - 30);
    var productList = [];
    for (let i = 0; i < products.length; i++) {
        var last30Days = { totalSold: 0, totalRevenue: 0 };
        var product = products[i]._doc;
        //Get list of invoice which have current product
        var invoices = yield Invoice_model_1.default.find({
            productList: { $elemMatch: { product: products[i]._id } },
        }).select({ productList: 1, _id: 0, createdAt: 1 });
        //Get all time revenue
        product.allTimeRevenue = yield getRevenue(invoices, products[i]._id);
        // Get last 30 days sold and revenues
        var invoices_L30D = invoices.filter((x) => x.createdAt <= today && x.createdAt >= L30D);
        last30Days.totalSold = invoices_L30D.length;
        last30Days.totalRevenue = yield getRevenue(invoices_L30D, products[i]._id);
        product.last30Days = last30Days;
        productList.push(product);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json(productList);
});
exports.getProductStatistic = getProductStatistic;
//# sourceMappingURL=shop.controller.js.map