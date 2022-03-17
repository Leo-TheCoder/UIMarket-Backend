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
      require: [true, "Please provide question id"],
    },
    objectId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide object id"],
    },
    action: {
      type: Number,
      required: [true, "Please provide action number"],
    },
  },
  {
    timestamps: true,
  }
);

VotingSchema.index({ userId: 1, questionId: 1, objectId: 1 }, { unique: true });

export default mongoose.model("Voting", VotingSchema);
