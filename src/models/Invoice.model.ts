import mongoose from "mongoose";
import {} from "../constants";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    billingEmail: {
      type: String,
      required: [true, "Please provide email to receive product"],
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
      default: "Paid",
      enum: ["Paid", "Reviewed"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
