import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    reportObject: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide Object Id"],
      immutable: true,
    },
    reason: {
      type: String,
      required: [true, "Please provide reason"],
    },
    objectType: {
      type: String,
      required: [true, "Please provide type"],
      enum: ["Question", "Answer", "Comment", "Product", "Shop"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Report", ReportSchema);
