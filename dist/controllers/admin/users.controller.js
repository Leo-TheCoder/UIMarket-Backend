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
exports.sendMailForTest = exports.unverifyUser = exports.activeUser = exports.deactiveUser = exports.getAllUsers = void 0;
const Constants = __importStar(require("../../constants"));
const http_status_codes_1 = require("http-status-codes");
const User_model_1 = __importDefault(require("../../models/User.model"));
const errors_1 = require("../../errors");
const ErrorMessage = __importStar(require("../../errors/error_message"));
const sendMail_1 = require("../../utils/sendMail");
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
    FilterTypes["STATUS_ACTIVE"] = "status-active";
    FilterTypes["STATUS_NOT_VERIFIED"] = "status-not-verified";
    FilterTypes["STATUS_DEACTIVE"] = "status-deactive";
    FilterTypes["SELLER"] = "seller";
    FilterTypes["NON_SELLER"] = "non-seller";
})(FilterTypes || (FilterTypes = {}));
const filterObjMongoose = (filter) => {
    switch (filter) {
        case FilterTypes.STATUS_ACTIVE:
            return { customerStatus: 1 };
        case FilterTypes.STATUS_NOT_VERIFIED:
            return { customerStatus: 0 };
        case FilterTypes.STATUS_DEACTIVE:
            return { customerStatus: -1 };
        case FilterTypes.SELLER:
            return { shopId: { $ne: null } };
        case FilterTypes.NON_SELLER:
            return { shopId: null };
        default:
            return {};
    }
};
const projectionUserList = {
    __v: 0,
    authenToken: 0,
    customerPassword: 0,
    customerBio: 0,
    refreshToken: 0,
};
const getAllUsers = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    const total = await User_model_1.default.countDocuments({
        ...filterObj,
    }).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product
    const users = await User_model_1.default.find({
        ...filterObj,
    }, projectionUserList)
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
        users,
    });
};
exports.getAllUsers = getAllUsers;
const deactiveUser = async (req, res) => {
    const { userId } = req.params;
    const user = await User_model_1.default.findById(userId, {
        customerStatus: 1,
    });
    if (!user) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    if (user.customerStatus !== -1) {
        user.customerStatus = -1; //Deactive
        await user.save();
    }
    else {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        user,
    });
};
exports.deactiveUser = deactiveUser;
const activeUser = async (req, res) => {
    const { userId } = req.params;
    const user = await User_model_1.default.findById(userId, {
        customerStatus: 1,
    });
    if (!user) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    if (user.customerStatus !== 1) {
        user.customerStatus = 1; //Active
        await user.save();
    }
    else {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_ACCOUNT_ACTIVATED);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        user,
    });
};
exports.activeUser = activeUser;
const unverifyUser = async (req, res) => {
    const { userId } = req.params;
    const user = await User_model_1.default.findById(userId, {
        customerStatus: 1,
    });
    if (!user) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    if (user.customerStatus !== 0) {
        user.customerStatus = 0; //Unverify account
        await user.save();
    }
    else {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        user,
    });
};
exports.unverifyUser = unverifyUser;
const sendMailForTest = async (req, res) => {
    const { email } = req.body;
    (0, sendMail_1.sendMailTest)(email, email);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Email has sent",
    });
};
exports.sendMailForTest = sendMailForTest;
//# sourceMappingURL=users.controller.js.map