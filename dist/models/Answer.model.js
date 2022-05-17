"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const AnswerSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
    },
    questionId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Question",
        required: [true, "Please provide question id"],
        immutable: true,
    },
    answerContent: {
        type: String,
        required: [true, "Please provide answer content"],
        minlength: constants_1.defaultMinLength,
    },
    bestAnswer: {
        type: Number,
        default: 0,
        enum: [0, 1],
    },
    totalUpvote: {
        type: Number,
        default: 0,
    },
    totalDownvote: {
        type: Number,
        default: 0,
    },
    answerStatus: {
        type: Number,
        default: 1,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Answer", AnswerSchema);
//# sourceMappingURL=Answer.model.js.map