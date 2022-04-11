import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ProductSchema = new mongoose.Schema(
  {
    shopID: {
      type: ObjectId,
      required: true,
    },
    productName: {
      type: String,
      minlength: defaultMinLength / 2,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    productDescription: {
      type: String,
      default: true,
      minlength: defaultMinLength,
    },
    productCategory: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    productPicture: [
      {
        type: String,
        required: true,
      },
    ],
    productStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    totalReview: {
      type: Number,
      default: 0,
    },
    productRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", ProductSchema);
