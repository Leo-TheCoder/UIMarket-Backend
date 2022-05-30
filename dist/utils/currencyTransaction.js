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
exports.shopWithdrawTransaction = exports.shopTransaction = exports.userTransaction = exports.pointRollBack = exports.pointTransaction = void 0;
//Library
const errors_1 = require("../errors");
//Model
const PointTransaction_model_1 = __importDefault(require("../models/PointTransaction.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const UserTransaction_model_1 = __importDefault(require("../models/UserTransaction.model"));
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const pointTransaction = async (userId, changeAmount, reason) => {
    //Checking userId
    const user = await User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Checking amount
    const currentAmount = user.customerWallet.point;
    const balanceAmount = currentAmount + changeAmount;
    if (balanceAmount < 0) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
    }
    //Record the transaction
    const transaction = await PointTransaction_model_1.default.create({
        toAccount: userId,
        reason: reason,
        currentAmount: currentAmount,
        changeAmount: changeAmount,
        balanceAmount: balanceAmount,
    });
    if (!transaction) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_FAILED);
    }
    else {
        user.customerWallet.point = balanceAmount;
        const result = await user.save();
        if (!result) {
            const rollBack = await PointTransaction_model_1.default.findByIdAndUpdate(transaction._id, { transactionStatus: 0 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
        else {
            return transaction;
        }
    }
};
exports.pointTransaction = pointTransaction;
const pointRollBack = async (userId, transactionId, changeAmount) => {
    //Checking userId
    const user = await User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Delete transaction and roll back point
    const currentAmount = user.customerWallet.point;
    const balanceAmount = currentAmount - changeAmount;
    const transaction = await PointTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 0 });
    if (transaction) {
        user.customerWallet.point = balanceAmount;
        const result = await user.save();
        if (result) {
            return result;
        }
        else {
            const rollBack = await PointTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 1 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.pointRollBack = pointRollBack;
const userTransaction = async (userId, invoiceId, changeAmount, reason) => {
    //Checking userId and shopId
    const userPromise = User_model_1.default.findOne({ _id: userId, customerStatus: 1 }).lean();
    const invoicePromise = Invoice_model_1.default.findOne({ _id: invoiceId }).lean();
    const [user, invoice] = await Promise.all([userPromise, invoicePromise]);
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    else if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Record the transaction
    const transaction = await UserTransaction_model_1.default.create({
        userId: userId,
        invoiceId: invoiceId,
        reason: reason,
        changeAmount: changeAmount,
    });
    if (!transaction) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_FAILED);
    }
    else {
        return transaction;
    }
};
exports.userTransaction = userTransaction;
const shopTransaction = async (shopId, invoiceId, reason, changeAmount) => {
    //Checking shopId
    const shop = await Shop_model_1.default.findOne({ _id: shopId, shopStatus: 1 });
    if (!shop) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    const currentAmount = shop.shopBalance;
    const balanceAmount = currentAmount + changeAmount;
    //Checking invoice ID
    const invoice = await Invoice_model_1.default.findById(invoiceId);
    if (!invoice) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Update shop wallet
    shop.shopBalance = balanceAmount;
    const newBalance = await shop.save();
    if (!newBalance) {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
    else {
        const transaction = await ShopTransaction_model_1.default.create({
            shopId: shopId,
            invoiceId: invoiceId,
            reason: reason,
            currentAmount: currentAmount,
            changeAmount: changeAmount,
            balanceAmount: balanceAmount,
        });
        return transaction;
    }
};
exports.shopTransaction = shopTransaction;
const shopWithdrawTransaction = async (shopFullDocument, reason, changeAmount) => {
    const shop = shopFullDocument;
    const currentAmount = shop.shopBalance;
    const balanceAmount = currentAmount + changeAmount;
    if (balanceAmount < 0) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
    }
    //Update shop wallet
    shop.shopBalance = balanceAmount;
    const newBalance = await shop.save();
    if (!newBalance) {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
    const transaction = await ShopTransaction_model_1.default.create({
        shopId: shop._id,
        reason: reason,
        currentAmount: currentAmount,
        changeAmount: changeAmount,
        balanceAmount: balanceAmount,
    });
    return transaction;
};
exports.shopWithdrawTransaction = shopWithdrawTransaction;
//# sourceMappingURL=currencyTransaction.js.map