import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

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
      immutable: true,
    },
    answerContent: {
      type: String,
      required: [true, "Please provide answer content"],
      minlength: defaultMinLength,
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
  },
  { timestamps: true },
);

export default mongoose.model("Answer", AnswerSchema);
