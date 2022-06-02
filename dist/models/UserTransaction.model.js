"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserTransactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
    },
    invoiceId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Invoice",
        required: [true, "Please provide invoice id"],
    },
    reason: {
        type: String,
    },
    changeAmount: {
        type: Number,
        required: true,
    },
    transactionStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User Transaction", UserTransactionSchema);
//# sourceMappingURL=UserTransaction.model.js.map