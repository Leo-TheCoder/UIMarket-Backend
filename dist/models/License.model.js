"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const enum_1 = require("../types/enum");
const LicenseSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    invoice: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please provide invoice ID"],
        ref: "Order",
    },
    shop: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please shop ID"],
        ref: "Shop",
    },
    product: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please product ID"],
        ref: "Product",
    },
    boughtTime: {
        type: Date,
        required: [true, "Please provide bought time"],
    },
    licenseFile: {
        type: String,
        required: [true, "Please provide license file"],
    },
    productPrice: {
        type: Number,
    },
    licenseStatus: {
        type: String,
        enum: [
            enum_1.LicesneStatusEnum.ACTIVE,
            enum_1.LicesneStatusEnum.DEACTIVE,
            enum_1.LicesneStatusEnum.REFUNDING,
        ],
        default: enum_1.LicesneStatusEnum.ACTIVE,
    },
}, { timestamps: true });
LicenseSchema.statics.deactiveLicenses = function (licenseIds) {
    return this.updateMany({
        _id: { $in: licenseIds },
    }, {
        licenseStatus: enum_1.LicesneStatusEnum.DEACTIVE,
    });
};
LicenseSchema.methods.deactivate = async function () {
    this.licenseStatus = enum_1.LicesneStatusEnum.DEACTIVE;
    await this.save();
};
LicenseSchema.index({ invoice: 1, product: 1 }, { unique: true });
exports.default = mongoose_1.default.model("License", LicenseSchema);
//# sourceMappingURL=License.model.js.map