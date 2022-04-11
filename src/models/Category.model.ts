import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const CategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    totalProduct: {
      type: Number,
      default: 0,
    },
    categoryStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Category", CategorySchema);
