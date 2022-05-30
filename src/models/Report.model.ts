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
      minlength: defaultMinLength,
    },
    reportSolution: {
      type: String,
    },
    objectType: {
      type: String,
      required: [true, "Please provide type"],
      enum: ["Question", "Answer", "Comment", "Product", "Shop"],
    },
    resolveFlag: {
      type: Number,
      default: 0,
      enum: [0, 1, -1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Report", ReportSchema);
