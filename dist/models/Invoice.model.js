"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OrderSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    productList: [
        {
            shop: {
                type: mongoose_1.default.Types.ObjectId,
                ref: "Shop",
                required: [true, "Please provide shopId"],
            },
            product: {
                type: mongoose_1.default.Types.ObjectId,
                ref: "Product",
                required: [true, "Please provide product ID"],
            },
            productPrice: {
                type: Number,
                required: [true, "Please provide product price"],
                min: 0,
            },
            isReview: {
                type: Number,
                default: 0,
                enum: [0, 1],
            },
            _id: false,
        },
    ],
    invoiceTotal: {
        type: Number,
        required: [true, "Please provide invoice total"],
    },
    transactionId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Coin Transaction",
        required: [false, "Please provide transaction Id"],
    },
    // invoiceStatus: {
    //   type: String,
    //   default: "Paid",
    //   enum: ["Paid", "Reviewed"],
    // },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=Invoice.model.js.map