import mongoose from "mongoose";
import { defaultMinLength } from "../constants";
import { RefundStatusEnum } from "../types/enum";

const RefundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    invoiceId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
      required: [true, "Please provide Invoice ID"],
      immutable: true,
    },
    licenseIds: [
      {
        type: mongoose.Types.ObjectId,
        ref: "License",
        required: [true, "Please provide license ID"],
        immutable: true,
      },
    ],
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
      default: RefundStatusEnum.PENDING,
      enum: [
        RefundStatusEnum.PENDING,
        RefundStatusEnum.RESOLVED,
        RefundStatusEnum.DECLINED,
      ],
    },
    refundAmount: {
      type: Number,
      required: [true, "Please provide refund amount"],
    }
  },
  { timestamps: true }
);

RefundSchema.index({ invoiceId:1 }, { unique: true });
export default mongoose.model("Refund", RefundSchema);
