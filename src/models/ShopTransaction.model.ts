import mongoose from "mongoose";

const ShopTransactionSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Types.ObjectId,
      ref: "Shop",
      required: [true, "Please provide shop id"],
    },
    invoiceId: {
      type: mongoose.Types.ObjectId,
      ref: "Invoice",
      required: false,
    },
    reason: {
      type: String,
    },
    currentAmount: {
      type: Number,
      required: true,
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    transactionStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Shop Transaction", ShopTransactionSchema);
