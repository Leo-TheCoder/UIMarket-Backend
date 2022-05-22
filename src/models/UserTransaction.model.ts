import mongoose from "mongoose";

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
      default: 1,
      enum: [0, 1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("User Transaction", UserTransactionSchema);
