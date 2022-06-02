import mongoose from "mongoose";
import { defaultMinLength } from "../constants";

const ReportStatusSchema = new mongoose.Schema(
  {
    reportObject: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide Object Id"],
      immutable: true,
    },
    objectType: {
      type: String,
      required: [true, "Please provide type"],
      enum: ["Question", "Answer", "Comment", "Product", "Shop"],
    },
    reportQuantity: {
      type: Number,
      default: 0,
    },
    reportSolution: {
      type: String,
    },
    resolveFlag: {
      type: Number,
      default: 0,
      enum: [0, 1, -1],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Report Status", ReportStatusSchema);
