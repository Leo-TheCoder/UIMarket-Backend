"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const QuestionTagSchema = new mongoose_1.default.Schema({
    tagName: {
        type: String,
        required: [true, "Please provide tag name"],
        maxlength: 20,
        minlength: 2,
        lowercase: true,
        trim: true,
    },
    totalQuestion: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("QuestionTag", QuestionTagSchema);
//# sourceMappingURL=QuestionTag.model.js.map