import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
    },
    invoice: {
      type: mongoose.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Please provide invoice"],
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: [true, "Please provide product ID"],
    },
    productReview: {
      type: String,
    },
    productRating: {
      type: Number,
      required: [true, "Please provide product rating"],
      min: 1,
      max: 5,
    },
    reviewPictures: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

ReviewSchema.index({ invoice: 1, product: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);
