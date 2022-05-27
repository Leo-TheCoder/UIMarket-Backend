import mongoose from "mongoose";
import { LicesneStatusEnum } from "../types/enum";



const LicenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please provide user ID"],
      immutable: true,
    },
    invoice: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide invoice ID"],
      ref: "Order",
    },
    shop: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please shop ID"],
      ref: "Shop",
    },
    product: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please product ID"],
      ref: "Product",
    },
    boughtTime: {
      type: Date,
      required: [true, "Please provide bought time"],
    },
    licenseFile: {
      type: String,
      required: [true, "Please provide license file"],
    },
    productPrice: {
      type: Number,
    },
    licenseStatus: {
      type: String,
      enum: [LicesneStatusEnum.ACTIVE, LicesneStatusEnum.DEACTIVE],
      default: LicesneStatusEnum.ACTIVE,
    }
  },
  { timestamps: true },
);

LicenseSchema.statics.deactiveLicenses = function (licenseIds:string[]) {
  return this.updateMany({
    _id: {$in: licenseIds}
  }, {
    licenseStatus: LicesneStatusEnum.DEACTIVE
  })
}

LicenseSchema.methods.deactivate = async function() {
  this.licenseStatus = LicesneStatusEnum.DEACTIVE;
  await this.save();
}
LicenseSchema.index({ invoice: 1, product: 1 }, { unique: true });

export default mongoose.model("License", LicenseSchema);