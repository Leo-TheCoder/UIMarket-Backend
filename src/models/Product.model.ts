import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ProductSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Types.ObjectId,
      ref: "Shop",
      required: [true, "Please provide shop ID"],
      immutable: true,
    },
    productName: {
      type: String,
      minlength: defaultMinLength / 2,
      required: [true, "Please provide product name"],
    },
    productPrice: {
      type: Number,
      required: [true, "Please provide product price"],
      min: 1,
    },
    productDescription: {
      type: String,
      default: true,
      minlength: defaultMinLength,
      required: [true, "Please provide product description"],
    },
    productCategory: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: [true, "Please provide product category"],
    },
    productPictures: [
      {
        type: String,
        required: [true, "Please provide at least 1 picture of product"],
      },
    ],
    productFiles: [
      {
        type: String,
        required: [true, "Please provide at least 1 product file"],
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
    allTimeView: {
      type: Number,
      default: 0,
    },
    deleteFlagged: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", ProductSchema);
