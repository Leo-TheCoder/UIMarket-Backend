import mongoose from "mongoose";

const SystemSchema = new mongoose.Schema(
  {
    buyerFee: {
      type: Number,
      default: 0,
    },
    sellerFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Systems", SystemSchema);