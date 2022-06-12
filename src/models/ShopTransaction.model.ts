import mongoose from "mongoose";
import { TransactionStatusEnum, TransactionActionEnum } from "../types/enum";

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
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    action: {
      type: String,
      enum: [
        TransactionActionEnum.RECEIVE,
        TransactionActionEnum.WITHDRAW,
        TransactionActionEnum.REFUND,
      ],
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
      default: TransactionStatusEnum.PENDING,
      enum: [
        TransactionStatusEnum.REFUNDED,
        TransactionStatusEnum.PENDING,
        TransactionStatusEnum.COMPLETED,
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Shop Transaction", ShopTransactionSchema);
