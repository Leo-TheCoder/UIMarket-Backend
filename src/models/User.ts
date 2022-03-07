import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
  _customer_Name: {
    type: String,
    required: [true, "Please provide name"],
  },
  _customer_Email: {
    type: String,
    required: [true, "Please provide email"],
    unique: true,
  },
  _customer_Password: {
    type: String,
    required: [true, "Please provide password"],
  },
  _customer_Phone: {
    type: String,
    default: null,
  },
  _customer_DOB: {
    type: Date,
    default: null,
  },
  _authen_Token: {
    required: false,
    Google: {
      type: String,
      default: null,
    }
  },
  _customer_Wallet: {
    _coin: {
      type: Number,
      default: 0,
    },
    _point: {
      type: Number,
      default: process.env.POINT_DEFAULT || 0,
    }
  },
  _created_Time: {
    type: Date,
    default: Date.now(),
  },
  _updated_Time: {
    type: Date,
    default: Date.now(),
  },
  _customer_Status: {
    type: Number,
    default: 1,
  }
});

UserSchema.pre("save", async function () {
  //Hasing password
  const salt = await bcrypt.genSalt(10);
  this._customer_Password = await bcrypt.hash(this._customer_Password, salt);
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, name: this._customer_Name },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this._customer_Password);
  return isMatch;
};

export default mongoose.model("Customer", UserSchema);
