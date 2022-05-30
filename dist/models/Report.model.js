"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const ReportSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user ID"],
        immutable: true,
    },
    reportObject: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please provide Object Id"],
        immutable: true,
    },
    reason: {
        type: String,
        required: [true, "Please provide reason"],
        minlength: constants_1.defaultMinLength,
    },
    objectType: {
        type: String,
        required: [true, "Please provide type"],
        enum: ["Question", "Answer", "Comment", "Product", "Shop"],
    },
    resolveFlag: {
        type: Number,
        default: 0,
        enum: [0, 1],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Report", ReportSchema);
//# sourceMappingURL=Report.model.js.map