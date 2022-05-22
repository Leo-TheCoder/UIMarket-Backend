"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const QuestionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
        immutable: true,
    },
    questionTitle: {
        type: String,
        required: [true, "Please provide question title"],
        length: { $gte: constants_1.defaultMinLength },
    },
    questionContent: {
        type: String,
        required: [true, "Please provide question content"],
        length: constants_1.defaultMinLength,
    },
    questionStatus: {
        type: Number,
        default: 1,
        enum: [0, 1],
    },
    questionBounty: {
        type: Number,
        default: -1,
    },
    bountyDueDate: {
        type: Date,
        default: null,
    },
    awardDueDate: {
        type: Date,
        default: null,
    },
    bountyActive: {
        type: Number,
        default: 0,
        enum: [0, 1],
    },
    totalAnswer: {
        type: Number,
        default: 0,
    },
    bestAnswer: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Answer",
    },
    totalView: {
        type: Number,
        default: 0,
    },
    totalUpvote: {
        type: Number,
        default: 0,
    },
    totalDownvote: {
        type: Number,
        default: 0,
    },
    questionTag: [
        {
            type: mongoose_1.default.Types.ObjectId,
            ref: "QuestionTag",
        },
    ],
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Question", QuestionSchema);
//# sourceMappingURL=Question.model.js.map