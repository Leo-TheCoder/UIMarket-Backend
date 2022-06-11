"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const enum_1 = require("../types/enum");
const ShopTransactionSchema = new mongoose_1.default.Schema({
    shopId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Shop",
        required: [true, "Please provide shop id"],
    },
    invoiceId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Invoice",
        required: false,
    },
    productId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Product",
        required: false,
    },
    action: {
        type: String,
        enum: [enum_1.TransactionActionEnum.RECEIVE, enum_1.TransactionActionEnum.WITHDRAW],
    },
    currentAmount: {
        type: Number,
        required: true,
    },
    changeAmount: {
        type: Number,
        required: true,
    },
    balanceAmount: {
        type: Number,
        required: true,
    },
    transactionStatus: {
        type: Number,
        default: enum_1.TransactionStatusEnum.PENDING,
        enum: [
            enum_1.TransactionStatusEnum.REFUNDED,
            enum_1.TransactionStatusEnum.PENDING,
            enum_1.TransactionStatusEnum.COMPLETED,
        ],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Shop Transaction", ShopTransactionSchema);
//# sourceMappingURL=ShopTransaction.model.js.map