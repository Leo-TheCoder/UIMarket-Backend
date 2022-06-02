"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const RefundSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    shopId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Shop",
        required: [true, "Please provide shop ID"],
        immutable: true,
    },
    invoiceId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Order",
        required: [true, "Please provide invoice ID"],
        immutable: true,
    },
    productId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide product ID"],
        immutable: true,
    },
    refundReason: {
        type: String,
        required: [true, "Please provide reason"],
        minlength: constants_1.defaultMinLength,
    },
    refundEvidences: [
        {
            type: String,
            required: [true, "Please provide evidence"],
        },
    ],
    refundStatus: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Resolved", "Declined"],
    },
}, { timestamps: true });
RefundSchema.index({ invoiceId: 1, productId: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Refund", RefundSchema);
//# sourceMappingURL=Refund.model.js.map