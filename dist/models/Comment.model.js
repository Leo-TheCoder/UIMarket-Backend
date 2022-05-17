"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const CommentSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
        immutable: true,
    },
    questionId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Question",
        required: [true, "Please provide question id"],
        immutable: true,
    },
    rootId: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please provide root id"],
        immutable: true,
    },
    rootType: {
        type: String,
        required: [true, "Please provide type"],
        enum: ["Question", "Answer"],
        immutable: true,
    },
    commentContent: {
        type: String,
        required: [true, "Please provide comment content"],
        minlength: constants_1.defaultMinLength / 2,
    },
    totalUpvote: {
        type: Number,
        default: 0,
    },
    commentStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Comment", CommentSchema);
//# sourceMappingURL=Comment.model.js.map