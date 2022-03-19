import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    questionId: {
      type: mongoose.Types.ObjectId,
      ref: "Question",
      required: [true, "Please provide question id"],
    },
    answerContent: {
      type: String,
      required: [true, "Please provide answer content"],
    },
    bestAnswer: {
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
    answerStatus: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Answer", AnswerSchema);