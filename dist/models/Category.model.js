"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CategorySchema = new mongoose_1.default.Schema({
    categoryName: {
        type: String,
        required: [true, "Please provide category name"],
    },
    totalProduct: {
        type: Number,
        default: 0,
    },
    categoryStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Category", CategorySchema);
//# sourceMappingURL=Category.model.js.map