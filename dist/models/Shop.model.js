"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const ShopSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
        immutable: true,
    },
    shopName: {
        type: String,
        required: [true, "Please provide shop name"],
        // minlength: defaultMinLength / 2,
    },
    shopPayPal: {
        type: String,
    },
    shopDescription: {
        type: String,
        required: [true, "Please provide shop description"],
        minlength: constants_1.defaultMinLength,
    },
    shopPhone: {
        type: String,
        required: false,
        length: 10,
    },
    shopEmail: {
        type: String,
        required: [true, "Please provide shop email"],
    },
    shopBanner: {
        type: String,
        required: false,
    },
    shopStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
    shopBalance: {
        type: Number,
        default: 0,
    },
    taxCode: {
        type: String,
        default: null,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Shop', ShopSchema);
//# sourceMappingURL=Shop.model.js.map