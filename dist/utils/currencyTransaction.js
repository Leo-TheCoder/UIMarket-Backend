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
exports.refundTransaction = exports.shopWithdrawTransaction = exports.shopTransactionObjects = exports.shopTransaction = exports.userTransaction = exports.pointRollBack = exports.pointTransaction = void 0;
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
//Enum
const enum_1 = require("../types/enum");
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
const userTransaction = async (userId, invoiceId, changeAmount, reason, status, opt) => {
    //Checking userId and shopId
    const userPromise = User_model_1.default.findOne({
        _id: userId,
        customerStatus: 1,
    })
        .session(opt.session)
        .lean();
    const invoicePromise = Invoice_model_1.default.findOne({ _id: invoiceId })
        .session(opt.session)
        .lean();
    const [user, invoice] = await Promise.all([userPromise, invoicePromise]);
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    else if (!invoice) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Record the transaction
    // const transaction = await UserTransactionModel.create({
    //   userId: userId,
    //   invoiceId: invoiceId,
    //   reason: reason,
    //   changeAmount: changeAmount,
    //   transactionStatus: status,
    // });
    const transaction = await new UserTransaction_model_1.default({
        userId: userId,
        invoiceId: invoiceId,
        reason: reason,
        changeAmount: changeAmount,
        transactionStatus: status,
    }).save(opt);
    if (!transaction) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_FAILED);
    }
    else {
        return transaction;
    }
};
exports.userTransaction = userTransaction;
const shopTransaction = async (shopId, invoiceId, productId, action, changeAmount, opt) => {
    //Checking shopId
    const shop = await Shop_model_1.default.findOne({ _id: shopId, shopStatus: 1 }).session(opt.session);
    if (!shop) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    const currentAmount = shop.shopBalance;
    const balanceAmount = currentAmount + changeAmount;
    //Checking invoice ID
    const invoice = await Invoice_model_1.default.findById(invoiceId).session(opt.session);
    if (!invoice) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    // //Update shop wallet
    // shop.shopBalance = balanceAmount;
    // const newBalance = await shop.save();
    const transaction = await new ShopTransaction_model_1.default({
        shopId: shopId,
        invoiceId: invoiceId,
        productId: productId,
        action: action,
        currentAmount: currentAmount,
        changeAmount: changeAmount,
        balanceAmount: balanceAmount,
    }).save(opt);
    return transaction;
};
exports.shopTransaction = shopTransaction;
const shopTransactionObjects = (invoice, action, sellerFee, shopBalances) => {
    const shopIds = shopBalances.map(shop => shop._id);
    const banlances = shopBalances.map(shop => shop.shopBalance);
    return invoice.productList.map((product, index) => {
        let netAmount = (product.productPrice * (100 - sellerFee)) / 100;
        netAmount = Math.round(netAmount * 100) / 100;
        const searchIndex = (s) => {
            for (let i = 0; i < shopIds.length; i++) {
                if (s == shopIds[i]) {
                    return i;
                }
            }
            return -1;
        };
        const shopIndex = searchIndex(product.shop);
        const currentAmount = banlances[shopIndex];
        const balanceAmount = currentAmount + netAmount;
        return {
            shopId: product.shop,
            invoiceId: invoice._id,
            productId: product.product,
            action: action,
            currentAmount: currentAmount,
            changeAmount: netAmount,
            balanceAmount: balanceAmount,
        };
    });
};
exports.shopTransactionObjects = shopTransactionObjects;
const shopWithdrawTransaction = async (shopFullDocument, changeAmount) => {
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
        action: enum_1.TransactionActionEnum.WITHDRAW,
        currentAmount: currentAmount,
        changeAmount: changeAmount,
        balanceAmount: balanceAmount,
        transactionStatus: enum_1.TransactionStatusEnum.COMPLETED,
    });
    return transaction;
};
exports.shopWithdrawTransaction = shopWithdrawTransaction;
const refundTransaction = async (userId, invoiceId, productIds, amount) => {
    const shopTransactionResult = await ShopTransaction_model_1.default.updateMany({
        invoiceId,
        productId: { $in: productIds },
    }, {
        transactionStatus: enum_1.TransactionStatusEnum.REFUNDED,
    });
    await UserTransaction_model_1.default.create({
        userId: userId,
        invoiceId: invoiceId,
        reason: `Refund from DeeX`,
        changeAmount: amount,
        transactionStatus: enum_1.TransactionStatusEnum.REFUNDED,
    });
};
exports.refundTransaction = refundTransaction;
//# sourceMappingURL=currencyTransaction.js.map