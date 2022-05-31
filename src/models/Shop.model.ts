import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ShopSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
      immutable: true,
    },
    shopName: {
      type: String,
      required: [true, "Please provide shop name"],
      // minlength: defaultMinLength / 2,
    },
    shopPayPal: {
      required: false,
      paypalEmail: {
        type: String,
      },
      paypalId: {
        type: String,
      },
    },
    shopDescription: {
      type: String,
      required: [true, "Please provide shop description"],
      minlength: defaultMinLength,
    },
    shopPhone: {
      type: String,
      required: false,
      length: 10,
    },
    shopEmail: {
      type: String,
      required: [true, "Please provide shop email"],
    },
    shopBanner: {
      type: String,
      required: false,
    },
    shopStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    shopBalance: {
      type: Number,
      default: 0,
    },
    taxCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Shop", ShopSchema);
