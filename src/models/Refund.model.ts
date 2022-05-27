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
    licenseId: {
      type: mongoose.Types.ObjectId,
      ref: "License",
      required: [true, "Please provide license ID"],
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
      default: RefundStatusEnum.PENDING,
      enum: [
        RefundStatusEnum.PENDING,
        RefundStatusEnum.RESOLVED,
        RefundStatusEnum.DECLINED,
      ],
    },
  },
  { timestamps: true }
);

RefundSchema.index({ licenseId: 1 }, { unique: true });
export default mongoose.model("Refund", RefundSchema);
