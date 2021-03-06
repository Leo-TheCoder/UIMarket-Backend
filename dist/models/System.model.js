"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const SystemSchema = new mongoose_1.default.Schema({
    buyerFee: {
        type: Number,
        default: 0,
    },
    sellerFee: {
        type: Number,
        default: 0,
    },
    periodToConfirmPayment: {
        type: Number,
        default: constants_1.acceptRefund,
    }
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Systems", SystemSchema);
//# sourceMappingURL=System.model.js.map