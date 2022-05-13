"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PointTransactionSchema = new mongoose_1.default.Schema({
    toAccount: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
    },
    reason: {
        type: String,
    },
    currentAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    changeAmount: {
        type: Number,
        required: true,
    },
    balanceAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    transactionStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Point Transaction", PointTransactionSchema);
//# sourceMappingURL=PointTransaction.model.js.map