import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    _user_id: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    _question_Title: {
      type: String,
      required: [true, "Please provide question title"],
    },
    _question_Content: {
      type: String,
      required: [true, "Please provide question content"],
    },
    _question_Status: {
      type: Number,
      default: 1,
    },
    _question_Bounty: {
      type: Number,
      default: -1,
    },
    _total_Answer: {
      type: Number,
      default: 0,
    },
    _total_Comment: {
      type: Number,
      default: 0,
    },
    _total_View: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Question", QuestionSchema);
