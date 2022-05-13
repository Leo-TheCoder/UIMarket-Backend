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
exports.coinRollBack = exports.coinTransaction = exports.pointRollBack = exports.pointTransaction = void 0;
//Library
const errors_1 = require("../errors");
//Model
const PointTransaction_model_1 = __importDefault(require("../models/PointTransaction.model"));
const CoinTransaction_model_1 = __importDefault(require("../models/CoinTransaction.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const pointTransaction = (userId, changeAmount, reason) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking userId
    const user = yield User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
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
    const transaction = yield PointTransaction_model_1.default.create({
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
        const result = yield user.save();
        if (!result) {
            const rollBack = yield PointTransaction_model_1.default.findByIdAndUpdate(transaction._id, { transactionStatus: 0 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
        else {
            return transaction;
        }
    }
});
exports.pointTransaction = pointTransaction;
const pointRollBack = (userId, transactionId, changeAmount) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking userId
    const user = yield User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Delete transaction and roll back point
    const currentAmount = user.customerWallet.point;
    const balanceAmount = currentAmount - changeAmount;
    const transaction = yield PointTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 0 });
    if (transaction) {
        user.customerWallet.point = balanceAmount;
        const result = yield user.save();
        if (result) {
            return result;
        }
        else {
            const rollBack = yield PointTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 1 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.pointRollBack = pointRollBack;
const coinTransaction = (userId, changeAmount, reason) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking userId
    const user = yield User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Checking amount
    const currentAmount = user.customerWallet.coin;
    const balanceAmount = currentAmount + changeAmount;
    if (balanceAmount < 0) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
    }
    //Record the transaction
    const transaction = yield PointTransaction_model_1.default.create({
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
        user.customerWallet.coin = balanceAmount;
        const result = yield user.save();
        if (!result) {
            const rollBack = yield CoinTransaction_model_1.default.findByIdAndUpdate(transaction._id, { transactionStatus: 0 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
        else {
            return transaction;
        }
    }
});
exports.coinTransaction = coinTransaction;
const coinRollBack = (userId, transactionId, changeAmount) => __awaiter(void 0, void 0, void 0, function* () {
    //Checking userId
    const user = yield User_model_1.default.findOne({ _id: userId, customerStatus: 1 });
    if (!user) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    //Delete transaction and roll back point
    const currentAmount = user.customerWallet.coin;
    const balanceAmount = currentAmount - changeAmount;
    const transaction = yield CoinTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 0 });
    if (transaction) {
        user.customerWallet.coin = balanceAmount;
        const result = yield user.save();
        if (result) {
            return result;
        }
        else {
            const rollBack = yield CoinTransaction_model_1.default.findByIdAndUpdate(transactionId, { transactionStatus: 1 });
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.coinRollBack = coinRollBack;
//# sourceMappingURL=currencyTransaction.js.map