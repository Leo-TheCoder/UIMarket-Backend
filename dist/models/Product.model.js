"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const ProductSchema = new mongoose_1.default.Schema({
    shopId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Shop",
        required: [true, "Please provide shop ID"],
        immutable: true,
    },
    productName: {
        type: String,
        minlength: constants_1.defaultMinLength / 2,
        required: [true, "Please provide product name"],
    },
    productPrice: {
        type: Number,
        required: [true, "Please provide product price"],
        min: 0,
    },
    productDescription: {
        type: String,
        default: true,
        minlength: constants_1.defaultMinLength,
        required: [true, "Please provide product description"],
    },
    productCategory: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Category",
        required: [true, "Please provide product category"],
    },
    productPictures: [
        {
            type: String,
            required: [true, "Please provide at least 1 picture of product"],
        },
    ],
    productFile: {
        type: String,
        required: [true, "Please provide at least 1 product file"],
    },
    productStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
    totalSold: {
        type: Number,
        default: 0,
    },
    totalReview: {
        type: Number,
        default: 0,
    },
    productRating: {
        type: Number,
        default: 0,
    },
    allTimeView: {
        type: Number,
        default: 0,
    },
    deleteFlagged: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Product", ProductSchema);
//# sourceMappingURL=Product.model.js.map