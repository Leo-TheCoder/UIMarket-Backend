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
    reason: {
        type: String,
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
        default: enum_1.TransactionStatus.PENDING,
        enum: [enum_1.TransactionStatus.PENDING, enum_1.TransactionStatus.COMPLETED],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Shop Transaction", ShopTransactionSchema);
//# sourceMappingURL=ShopTransaction.model.js.map