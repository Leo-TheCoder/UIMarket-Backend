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
exports.getProductsByShop = exports.findByName = exports.findById = exports.findByCategory = exports.getAllProducts = void 0;
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const errors_1 = require("../errors");
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const ErrorMessage = __importStar(require("../errors/error_message"));
var SortTypes;
(function (SortTypes) {
    SortTypes["MoneyAsc"] = "money-asc";
    SortTypes["MoneyDes"] = "money-des";
    SortTypes["NameAsc"] = "name-asc";
    SortTypes["NameDes"] = "name-des";
})(SortTypes || (SortTypes = {}));
var FilterTypes;
(function (FilterTypes) {
    FilterTypes["PRICE_FREE"] = "money-free";
    FilterTypes["PRICE_0_19"] = "money-0-19";
    FilterTypes["PRICE_20_39"] = "money-20-39";
    FilterTypes["PRICE_40_59"] = "money-40-59";
    FilterTypes["PRICE_60_79"] = "money-60-79";
    FilterTypes["PRICE_80"] = "money-80";
})(FilterTypes || (FilterTypes = {}));
const sortObjMongoose = (sort) => {
    if (sort === SortTypes.MoneyAsc) {
        return { productPrice: 1 };
    }
    if (sort === SortTypes.MoneyDes) {
        return { productPrice: -1 };
    }
    if (sort === SortTypes.NameAsc) {
        return { productName: 1 };
    }
    if (sort === SortTypes.NameDes) {
        return { productName: -1 };
    }
    return {};
};
const filterObjMongoose = (filter) => {
    switch (filter) {
        case FilterTypes.PRICE_FREE:
            return { productPrice: 0 };
        case FilterTypes.PRICE_0_19:
            return { productPrice: { $gt: 0, $lte: 19 } };
        case FilterTypes.PRICE_20_39:
            return { productPrice: { $gte: 20, $lte: 39 } };
        case FilterTypes.PRICE_40_59:
            return { productPrice: { $gte: 40, $lte: 59 } };
        case FilterTypes.PRICE_60_79:
            return { productPrice: { $gte: 60, $lte: 79 } };
        case FilterTypes.PRICE_80:
            return { productPrice: { $gte: 80 } };
        default:
            return {};
    }
};
const projectionProductList = {
    __v: 0,
    productDescription: 0,
};
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    const total = yield Product_model_1.default.countDocuments(Object.assign({ productStatus: 1 }, filterObj)).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const products = yield Product_model_1.default.find(Object.assign({ productStatus: 1 }, filterObj), projectionProductList)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "productCategory", select: ["categoryName"] })
        .lean();
    const productsResult = products.map((product) => {
        //get first picture
        product.productPicture = product.productPicture[0];
        return product;
    });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productsResult,
    });
});
exports.getAllProducts = getAllProducts;
const findByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    //Checking valid category
    const category = yield Category_model_1.default.findById(req.params.categoryId).lean();
    if (!category) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_CATEGORY_ID);
    }
    //Get total product
    const total = yield Product_model_1.default.countDocuments(Object.assign({ productCategory: req.params.categoryId, productStatus: 1 }, filterObj)).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const products = yield Product_model_1.default
        //
        .find(Object.assign({ productCategory: req.params.categoryId, productStatus: 1 }, filterObj))
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "productCategory", select: ["categoryName"] })
        .lean();
    const productsResult = products.map((product) => {
        //get first picture
        product.productPicture = product.productPicture[0];
        return product;
    });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productsResult,
    });
});
exports.findByCategory = findByCategory;
const findById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield Product_model_1.default.findByIdAndUpdate({
        _id: req.params.productId,
        productStatus: 1,
    }, { $inc: { allTimeView: 1 } });
    if (!product) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
    else {
        res.status(http_status_codes_1.StatusCodes.OK).json({ product });
    }
});
exports.findById = findById;
const findByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    const totalProduct = yield Product_model_1.default.aggregate([
        {
            $search: {
                index: "productName",
                text: {
                    path: "productName",
                    query: decodeURIComponent(req.params.productName),
                },
            },
        },
        { $match: Object.assign({ productStatus: 1 }, filterObj) },
        { $count: "total" },
    ]);
    if (totalProduct.length < 1) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            totalPages: 0,
            page,
            limit,
            products: []
        });
    }
    const total = totalProduct[0].total;
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const products = yield Product_model_1.default.aggregate([
        {
            $search: {
                index: "productName",
                text: {
                    path: "productName",
                    query: decodeURIComponent(req.params.productName),
                },
            },
        },
        { $match: Object.assign({ productStatus: 1 }, filterObj) },
        { $addFields: { score: { $meta: "searchScore" } } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        // { $sort: sortObj}
        { $project: projectionProductList },
        {
            $lookup: {
                from: "categories",
                localField: "productCategory",
                foreignField: "_id",
                pipeline: [{ $project: { categoryName: 1 } }],
                as: "productCategory",
            },
        },
        {
            $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "_id",
                pipeline: [{ $project: { shopName: 1 } }],
                as: "shop",
            },
        },
    ]);
    const productsResult = products.map((product) => {
        //get first item in array
        product.productPicture = product.productPicture[0];
        product.productCategory = product.productCategory[0];
        product.shop = product.shop[0];
        return product;
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productsResult,
    });
});
exports.findByName = findByName;
const getProductsByShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shopId = req.params.shopId;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    //Check shop ID
    const shop = yield Shop_model_1.default.find({ _id: shopId, shopStatus: 1 }).lean();
    if (!shop) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    //Get total product
    const total = yield Product_model_1.default.countDocuments(Object.assign({ shopId: shopId, productStatus: 1 }, filterObj)).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const products = yield Product_model_1.default.find(Object.assign({ shopId: shopId, productStatus: 1 }, filterObj))
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "productCategory", select: ["categoryName"] })
        .lean();
    const productsResult = products.map((product) => {
        //get first picture
        product.productPicture = product.productPicture[0];
        return product;
    });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productsResult,
    });
});
exports.getProductsByShop = getProductsByShop;
//# sourceMappingURL=product.controller.js.map