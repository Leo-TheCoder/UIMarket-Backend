import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    questionTitle: {
      type: String,
      required: [true, "Please provide question title"],
    },
    questionContent: {
      type: String,
      required: [true, "Please provide question content"],
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
    totalAnswer: {
      type: Number,
      default: 0,
    },
    totalComment: {
      type: Number,
      default: 0,
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
        type: mongoose.Types.ObjectId,
        ref: "QuestionTag",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Question", QuestionSchema);
