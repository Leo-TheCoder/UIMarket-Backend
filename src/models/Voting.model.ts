import mongoose from "mongoose";

const VotingSchema = new mongoose.Schema(
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
    objectId: {
      type: mongoose.Types.ObjectId,
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
  },
  {
    timestamps: true,
  },
);

VotingSchema.index({ userId: 1, questionId: 1, objectId: 1 }, { unique: true });

export default mongoose.model("Voting", VotingSchema);
