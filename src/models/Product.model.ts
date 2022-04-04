import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ProductSchema = new mongoose.Schema(
  {
    shopID: {
      type: ObjectId,
    },
    productName: {
      type: String,
      minlength: defaultMinLength / 2,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", ProductSchema);
