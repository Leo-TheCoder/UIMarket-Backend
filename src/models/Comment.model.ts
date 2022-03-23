import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "Customer",
    required: [true, "Please provide user id"],
  },
  answerId: {
    type: mongoose.Types.ObjectId,
    ref: "Answer",
    required: [true, "Please provide answer id"],
  },
  commentContent: {
    type: String,
    required: [true, "Please provide comment content"],
  },
  totalUpvote: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Comment", CommentSchema);
