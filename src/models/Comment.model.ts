import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "Customer",
    required: [true, "Please provide user id"],
  },
  rootId: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please provide root id"],
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
