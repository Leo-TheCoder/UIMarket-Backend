import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Please provide name"],
      minlength: 5,
    },
    customerAvatar: String,
    customerEmail: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
    },
    customerPassword: {
      type: String,
      required: [true, "Please provide password"],
    },
    customerPhone: {
      type: String,
      default: null,
    },
    customerDOB: {
      type: Date,
      default: null,
    },
    authenToken: {
      required: false,
      Google: {
        type: String,
        default: null,
      },
    },
    customerWallet: {
      coin: {
        type: Number,
        default: 0,
      },
      point: {
        type: Number,
        default: 0,
      },
    },
    customerStatus: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    customerBio: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function () {
  //Hasing password
  const salt = await bcrypt.genSalt(10);
  this.customerPassword = await bcrypt.hash(this.customerPassword, salt);
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      name: this.customerName,
      isActive: this.customerStatus === 1,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_LIFETIME,
    },
  );
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  const isMatch = await bcrypt.compare(
    candidatePassword,
    this.customerPassword,
  );
  return isMatch;
};

export default mongoose.model("Customer", UserSchema);
