import mongoose from "mongoose";

const CoinTransactionSchema = new mongoose.Schema(
  {
    toAccount: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    currentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Coin Transaction", CoinTransactionSchema);
