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
        shopId: {
          type: mongoose.Types.ObjectId,
          required: [true, "Please provide shopId"],
        },
        productId: {
          type: mongoose.Types.ObjectId,
          required: [true, "Please provide product ID"],
        },
        productPrice: {
          type: Number,
          required: [true, "Please provide product price"],
        },
      },
    ],
    invoiceTotal: {
      type: Number,
      required: [true, "Please provide invoice total"],
    },
    invoiceStatus: {
      type: String,
      default: "Created",
      enum: ["Created", "Paid", "Canceled", "Succeeded"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
