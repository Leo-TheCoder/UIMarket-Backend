import mongoose from "mongoose";
import {} from "../constants";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    productList: [
      {
        shop: {
          type: mongoose.Types.ObjectId,
          ref: "Shop",
          required: [true, "Please provide shopId"],
        },
        product: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: [true, "Please provide product ID"],
        },
        productPrice: {
          type: Number,
          required: [true, "Please provide product price"],
          min: 0,
        },
        productName: {
          type: String,
          required: [true, "Please provide product name"],
        },
        isReview: {
          type: Number,
          default: 0,
          enum: [0, 1],
        },
        _id: false,
      },
    ],
    invoiceTotal: {
      type: Number,
      required: [true, "Please provide invoice total"],
    },
    transactionId: {
      type: mongoose.Types.ObjectId,
      ref: "Coin Transaction",
      required: [false, "Please provide transaction Id"],
    },
    invoiceStatus: {
      type: String,
      default: "Waiting",
      enum: ["Waiting", "Paid"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
