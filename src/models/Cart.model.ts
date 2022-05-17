import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: [true, "Please provide product ID"],
    },
  },
  { timestamps: true },
);

CartSchema.index({ userId: 1, product: 1 }, { unique: true });
export default mongoose.model("Cart", CartSchema);
