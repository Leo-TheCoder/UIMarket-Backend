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
exports.getProductStatisticV2 = exports.getProductsByName = exports.paymentHistory = exports.getProductStatistic = exports.activeProduct = exports.deactiveProduct = exports.getShopByName = exports.getShopById = exports.updateShop = exports.getAllProduct = exports.updateProduct = exports.deleteProduct = exports.uploadProduct = exports.createShop = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
//Model
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const License_model_1 = __importDefault(require("../models/License.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const createShop = async (req, res) => {
    const { userId } = req.user;
    const shop = await Shop_model_1.default.findOne({ userId: userId }).lean();
    if (shop) {
        if (shop.shopStatus == 0) {
            throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
        }
        else {
            throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
        }
    }
    const newShop = await Shop_model_1.default.create({
        ...req.body,
        userId: userId,
    });
    if (newShop) {
        const user = await User_model_1.default.findByIdAndUpdate(userId, { shopId: newShop._id }, { new: true });
        const token = user.createJWT();
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ newShop, token });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.createShop = createShop;
const uploadProduct = async (req, res) => {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const { productCategory } = req.body;
    if (!productCategory) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const category = await Category_model_1.default.findById(productCategory);
    if (!category) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_CATEGORY_ID);
    }
    const product = await Product_model_1.default.create({ ...req.body, shopId: shopId });
    if (product) {
        category.totalProduct += 1;
        await category.save();
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ product });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.uploadProduct = uploadProduct;
const deleteProduct = async (req, res) => {
    const { shopId } = req.user;
    const product = await Product_model_1.default.findOne({ _id: req.params.productId });
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
    const result = await product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.deleteProduct = deleteProduct;
const updateProduct = async (req, res) => {
    const { shopId } = req.user;
    const product = await Product_model_1.default.findOne({
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
    product.productPictures = req.body.productPictures || product.productPictures;
    product.productFile = req.body.productFile || product.productFile;
    product.updatedAt = new Date();
    const updatedProduct = await product.save();
    if (updatedProduct) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ updatedProduct });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.updateProduct = updateProduct;
const getAllProduct = async (req, res) => {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const products = await Product_model_1.default
        //
        .find({ shopId: shopId })
        .populate({ path: "productCategory", select: ["categoryName"] })
        .lean();
    res.status(http_status_codes_1.StatusCodes.OK).json({ products });
};
exports.getAllProduct = getAllProduct;
const updateShop = async (req, res) => {
    const { shopId } = req.user;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const shop = await Shop_model_1.default.findOne({ _id: shopId, shopStatus: 1 });
    shop.shopDescription = req.body.shopDescription || shop.shopDescription;
    shop.shopPhone = req.body.shopPhone || shop.shopPhone;
    shop.shopEmail = req.body.shopEmail || shop.shopEmail;
    shop.shopPayPal = req.body.shopPayPal || shop.shopPayPal;
    shop.shopBanner = req.body.shopBanner || shop.shopBanner;
    shop.shopName = req.body.shopName || shop.shopName;
    const result = await shop.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.updateShop = updateShop;
const getShopById = async (req, res) => {
    const selectOption = { __v: 0 };
    if (!req.user?.shopId || req.user.shopId != req.params.shopId) {
        selectOption.shopIDCard = 0;
        selectOption.shopBalance = 0;
        selectOption.taxCode = 0;
    }
    const shop = await Shop_model_1.default.findOne({
        _id: req.params.shopId,
        shopStatus: 1,
    })
        .select(selectOption)
        .populate({ path: "userId", select: "customerAvatar" })
        .lean();
    if (!shop) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    else {
        res.status(http_status_codes_1.StatusCodes.OK).json({ shop });
    }
};
exports.getShopById = getShopById;
const getShopByName = async (req, res) => {
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
    const totalShop = await Shop_model_1.default.aggregate([
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
    const shops = await Shop_model_1.default.aggregate([
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
};
exports.getShopByName = getShopByName;
const deactiveProduct = async (req, res) => {
    const { shopId } = req.user;
    const product = await Product_model_1.default.findOne({
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
    const result = await product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.deactiveProduct = deactiveProduct;
const activeProduct = async (req, res) => {
    const { shopId } = req.user;
    const product = await Product_model_1.default.findOne({
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
    const result = await product.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.activeProduct = activeProduct;
const getRevenue = async (invoices, productId) => {
    let revenue = 0;
    for (let i = 0; i < invoices.length; i++) {
        const product = invoices[i].productList.find((x) => String(x.product) == String(productId));
        revenue += product.productPrice;
    }
    return revenue;
};
const getProductStatistic = async (req, res) => {
    //Get list of products
    const products = await Product_model_1.default.find({
        shopId: req.user.shopId,
        deleteFlagged: 0,
    }).select({ productFile: 0, deleteFlagged: 0, __v: 0 });
    const today = new Date();
    let L30D = new Date(today.getTime());
    L30D.setDate(L30D.getDate() - 30);
    let productList = [];
    for (let i = 0; i < products.length; i++) {
        let last30Days = { totalSold: 0, totalRevenue: 0 };
        let product = products[i]._doc;
        //Get list of invoice which have current product
        let invoices = await Invoice_model_1.default.find({
            productList: { $elemMatch: { product: products[i]._id } },
        }).select({ productList: 1, _id: 0, createdAt: 1 });
        //Get all time revenue
        product.allTimeRevenue = await getRevenue(invoices, products[i]._id);
        // Get last 30 days sold and revenues
        let invoices_L30D = invoices.filter((x) => x.createdAt <= today && x.createdAt >= L30D);
        last30Days.totalSold = invoices_L30D.length;
        last30Days.totalRevenue = await getRevenue(invoices_L30D, products[i]._id);
        product.last30Days = last30Days;
        productList.push(product);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json(productList);
};
exports.getProductStatistic = getProductStatistic;
const paymentHistory = async (req, res) => {
    //Check authen
    const shopId = req.user?.shopId;
    if (!shopId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await ShopTransaction_model_1.default.countDocuments({
        shopId: shopId,
    });
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const transactions = await ShopTransaction_model_1.default.find({
        shopId: shopId,
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        transactions,
    });
};
exports.paymentHistory = paymentHistory;
const getProductsByName = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const { shopId } = req.user;
    const selectOption = {
        __v: 0,
        productFile: 0,
        deleteFlagged: 0,
    };
    const matchOption = {
        shopId: new mongoose_1.default.Types.ObjectId(shopId),
        deleteFlagged: 0,
    };
    const totalProducts = await Product_model_1.default.aggregate([
        {
            $search: {
                index: "productName",
                text: {
                    path: "productName",
                    query: decodeURIComponent(req.params.productName),
                },
            },
        },
        { $match: matchOption },
        { $count: "total" },
    ]);
    if (totalProducts.length < 1) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            totalPages: 0,
            page,
            limit,
            products: [],
        });
    }
    const total = totalProducts[0].total;
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const products = await Product_model_1.default.aggregate([
        {
            $search: {
                index: "productName",
                text: {
                    path: "productName",
                    query: decodeURIComponent(req.params.productName),
                },
            },
        },
        { $match: matchOption },
        { $addFields: { score: { $meta: "searchScore" } } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: selectOption },
    ]);
    const today = new Date();
    const L30D = new Date(today.getTime());
    L30D.setDate(L30D.getDate() - 30);
    const productPromises = products.map((product) => {
        const last30Days = { totalSold: 0, totalRevenue: 0 };
        let revenue = 0;
        return License_model_1.default.find({
            product: product._id,
        }).then((licenses) => {
            licenses.forEach((license) => {
                revenue += license.productPrice;
            });
            const licenses_L30D = licenses.filter((x) => x.createdAt <= today && x.createdAt >= L30D);
            last30Days.totalSold = licenses_L30D.length;
            licenses.forEach((license) => {
                last30Days.totalRevenue += license.productPrice;
            });
            return {
                ...product,
                allTimeRevenue: revenue,
                last30Days,
            };
        });
    });
    const productList = await Promise.all(productPromises);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productList,
    });
};
exports.getProductsByName = getProductsByName;
const getProductStatisticV2 = async (req, res) => {
    const { shopId } = req.user;
    const selectOption = {
        productFile: 0,
        deleteFlagged: 0,
        __v: 0,
    };
    const products = await Product_model_1.default.find({
        shopId,
        deleteFlagged: 0,
    })
        .select(selectOption)
        .lean();
    const today = new Date();
    const L30D = new Date(today.getTime());
    L30D.setDate(L30D.getDate() - 30);
    const productPromises = products.map((product) => {
        const last30Days = { totalSold: 0, totalRevenue: 0 };
        let revenue = 0;
        return License_model_1.default.find({
            product: product._id,
        }).then((licenses) => {
            licenses.forEach((license) => {
                revenue += license.productPrice;
            });
            const licenses_L30D = licenses.filter((x) => x.createdAt <= today && x.createdAt >= L30D);
            last30Days.totalSold = licenses_L30D.length;
            licenses.forEach((license) => {
                last30Days.totalRevenue += license.productPrice;
            });
            return {
                ...product,
                allTimeRevenue: revenue,
                last30Days,
            };
        });
    });
    const productList = await Promise.all(productPromises);
    res.status(http_status_codes_1.StatusCodes.OK).json(productList);
};
exports.getProductStatisticV2 = getProductStatisticV2;
//# sourceMappingURL=shop.controller.js.map