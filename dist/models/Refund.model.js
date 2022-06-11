"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const enum_1 = require("../types/enum");
const RefundSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    invoiceId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Order",
        required: [true, "Please provide Invoice ID"],
        immutable: true,
    },
    licenseIds: [
        {
            type: mongoose_1.default.Types.ObjectId,
            ref: "License",
            required: [true, "Please provide license ID"],
            immutable: true,
        },
    ],
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
        default: enum_1.RefundStatusEnum.PENDING,
        enum: [
            enum_1.RefundStatusEnum.PENDING,
            enum_1.RefundStatusEnum.RESOLVED,
            enum_1.RefundStatusEnum.DECLINED,
        ],
    },
}, { timestamps: true });
RefundSchema.index({ invoiceId: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Refund", RefundSchema);
//# sourceMappingURL=Refund.model.js.map