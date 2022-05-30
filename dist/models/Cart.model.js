"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CartSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    product: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide product ID"],
    },
}, { timestamps: true });
CartSchema.index({ userId: 1, product: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Cart", CartSchema);
//# sourceMappingURL=Cart.model.js.map