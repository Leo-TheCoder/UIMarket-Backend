import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ShopSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user id"],
    },
    shopName: {
      type: String,
      required: [true, "Please provide shop name"],
      minlength: defaultMinLength / 2,
    },
    shopIDCard: [
      {
        type: String,
        required: [true, "Please provide shop ID Card picture"],
      },
    ],
    shopDescription: {
      type: String,
      required: [true, "Please provide shop description"],
      minlength: defaultMinLength,
    },
    shopPhone: {
      type: String,
      required: [true, "Please provide shop phone number"],
      length: 10,
    },
    shopEmail: {
      type: String,
      required: [true, "Please provide shop email"],
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
  },
  { timestamps: true },
);

export default mongoose.model("Shop", ShopSchema);
