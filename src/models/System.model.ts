import mongoose from "mongoose";
import {acceptRefund as ACCEPT_REFUND} from '../constants';

const SystemSchema = new mongoose.Schema(
  {
    buyerFee: {
      type: Number,
      default: 0,
    },
    sellerFee: {
      type: Number,
      default: 0,
    },
    periodToConfirmPayment: {
      type: Number,
      default: ACCEPT_REFUND,
    } 
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Systems", SystemSchema);