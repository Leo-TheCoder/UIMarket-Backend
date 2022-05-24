import mongoose from "mongoose";
import { TransactionStatus } from "../types/enum";

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
      default: TransactionStatus.COMPLETED,
      enum: [TransactionStatus.PENDING, TransactionStatus.COMPLETED],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Shop Transaction", ShopTransactionSchema);
