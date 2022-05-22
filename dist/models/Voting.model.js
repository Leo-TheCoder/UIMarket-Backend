"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const VotingSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Customer",
        required: [true, "Please provide user id"],
    },
    questionId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Question",
        required: [true, "Please provide question id"],
    },
    objectId: {
        type: mongoose_1.default.Types.ObjectId,
        required: [true, "Please provide object id"],
    },
    type: {
        type: String,
        required: [true, "Please provide type of object"],
        enum: ["Question", "Answer", "Comment"],
    },
    action: {
        type: Number,
        required: [true, "Please provide action number"],
        enum: [0, 1],
    },
}, {
    timestamps: true,
});
VotingSchema.index({ userId: 1, questionId: 1, objectId: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Voting", VotingSchema);
//# sourceMappingURL=Voting.model.js.map