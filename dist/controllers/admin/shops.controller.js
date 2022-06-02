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
exports.activeShop = exports.deactiveShop = exports.getAllShops = void 0;
const Constants = __importStar(require("../../constants"));
const http_status_codes_1 = require("http-status-codes");
const Shop_model_1 = __importDefault(require("../../models/Shop.model"));
const errors_1 = require("../../errors");
const ErrorMessage = __importStar(require("../../errors/error_message"));
var SortTypes;
(function (SortTypes) {
    SortTypes["OLDEST"] = "oldest";
    SortTypes["NEWEST"] = "newest";
})(SortTypes || (SortTypes = {}));
const sortObjMongoose = (sort) => {
    switch (sort) {
        case SortTypes.OLDEST:
            return { createdAt: 1 };
        case SortTypes.NEWEST:
            return { createdAt: -1 };
        default:
            return {};
    }
};
var FilterTypes;
(function (FilterTypes) {
})(FilterTypes || (FilterTypes = {}));
const filterObjMongoose = (filter) => {
    switch (filter) {
        default:
            return {};
    }
};
const projectionShopList = {
    __v: 0,
};
const getAllShops = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    const total = await Shop_model_1.default.countDocuments({
        ...filterObj,
    }).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const shops = await Shop_model_1.default.find({
        ...filterObj,
    }, projectionShopList)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        // .populate({ path: "productCategory", select: ["categoryName"] })
        // .populate({ path: "shopId", select: ["shopName"] })
        .lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        shops,
    });
};
exports.getAllShops = getAllShops;
const deactiveShop = async (req, res) => {
    const { shopId } = req.params;
    const shop = await Shop_model_1.default.findById(shopId, {
        shopStatus: 1,
    });
    if (!shop) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Deactivate shop
    shop.shopStatus = 0;
    await shop.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        shop,
    });
};
exports.deactiveShop = deactiveShop;
const activeShop = async (req, res) => {
    const { shopId } = req.params;
    const shop = await Shop_model_1.default.findById(shopId, {
        shopStatus: 0,
    });
    if (!shop) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Activate shop
    shop.shopStatus = 1;
    await shop.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        shop,
    });
};
exports.activeShop = activeShop;
//# sourceMappingURL=shops.controller.js.map