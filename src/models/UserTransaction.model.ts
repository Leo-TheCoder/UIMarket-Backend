import mongoose from "mongoose";
import { TransactionStatus } from "../types/enum";

const UserTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    invoiceId: {
      type: mongoose.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Please provide invoice id"],
    },
    reason: {
      type: String,
    },
    changeAmount: {
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

export default mongoose.model("User Transaction", UserTransactionSchema);
