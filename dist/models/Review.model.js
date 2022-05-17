"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ReviewSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
    },
    invoice: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Invoice",
        required: [true, "Please provide invoice"],
    },
    product: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide product ID"],
    },
    productReview: {
        type: String,
        required: [true, "Please provide product review"],
    },
    productRating: {
        type: Number,
        required: [true, "Please provide product rating"],
        min: 1,
        max: 5,
    },
    reviewPictures: [
        {
            type: String,
        },
    ],
}, { timestamps: true });
ReviewSchema.index({ invoice: 1, product: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Review", ReviewSchema);
//# sourceMappingURL=Review.model.js.map