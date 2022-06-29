import mongoose from "mongoose";

const QuestionTagSchema = new mongoose.Schema(
  {
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
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("QuestionTag", QuestionTagSchema);
