import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const RefundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    shopId: {
      type: mongoose.Types.ObjectId,
      ref: "Shop",
      required: [true, "Please provide shop ID"],
      immutable: true,
    },
    invoiceId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
      required: [true, "Please provide invoice ID"],
      immutable: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: [true, "Please provide product ID"],
      immutable: true,
    },
    refundReason: {
      type: String,
      required: [true, "Please provide reason"],
      minlength: defaultMinLength,
    },
    refundEvidences: [
      {
        type: String,
        required: [true, "Please provide evidence"],
      },
    ],
    refundStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Resolved", "Declined"],
    },
  },
  { timestamps: true },
);

RefundSchema.index({ invoiceId: 1, productId: 1 }, { unique: true });
export default mongoose.model("Refund", RefundSchema);
