import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
      immutable: true,
    },
    questionId: {
      type: mongoose.Types.ObjectId,
      ref: "Question",
      required: [true, "Please provide question id"],
      immutable: true,
    },
    rootId: {
      type: mongoose.Types.ObjectId,
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
      minlength: defaultMinLength / 2,
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
  },
  { timestamps: true },
);

export default mongoose.model("Comment", CommentSchema);
