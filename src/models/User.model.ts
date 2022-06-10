import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Please provide name"],
      minlength: 5,
    },
    customerAvatar: {
      type: String,
      required: false,
    },
    shopId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    customerEmail: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      immutable: true,
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
      default: 0,
      enum: [-1, 0, 1],
    },
    customerBio: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    portfolio: {
      images: [{
        type: String,
        required: false,
      }]
    }
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.hashPassword = async function () {
  const salt = await bcrypt.genSalt(10);
  this.customerPassword = await bcrypt.hash(this.customerPassword, salt);
};

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      shopId: this.shopId,
      name: this.customerName,
      isActive: this.customerStatus === 1,
      isAdmin: this.isAdmin,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(
    candidatePassword,
    this.customerPassword
  );
  return isMatch;
};

UserSchema.methods.createRefreshToken = async function () {
  const token = jwt.sign({ userId: this._id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESHTOKEN_LIFETIME, //1 day
  });
  this.refreshToken = token;
  return token;
};

UserSchema.methods.verifyToken = function (token: string) {
  interface ITokenPayload {
    userId: string;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ITokenPayload;
    return payload.userId;
  } catch (error) {
    return null;
  }
};

UserSchema.methods.compareToken = function (candidateToken: string) {
  return candidateToken === this.refreshToken;
};

UserSchema.methods.createAccountWithGoogleID = async function (
  customerName: string,
  googleId: string,
  customerEmail: string,
  customerAvatar: string
) {
  this.customerName = customerName;
  this.customerEmail = customerEmail;
  this.customerAvatar = customerAvatar;
  this.authenToken.Google = googleId;

  //active account
  this.customerStatus = 1;

  //random password
  this.customerPassword = uuidv4();
  await this.hashPassword();

  await this.save();
};

UserSchema.methods.doesAccountCreatedWithGoogle = function () {
  return this.authenToken.Google ? true : false;
};

UserSchema.methods.verifyGoogleID = function (googleId: string) {
  return this.authenToken.Google === googleId;
};

UserSchema.methods.updateAccountWithGoogle = async function (
  googleId: string,
  customerAvatar: string
) {
  this.customerStatus = 1;
  this.authenToken.Google = googleId;
  if (!this.customerAvatar) {
    this.customerAvatar = customerAvatar;
  }
  await this.save();
};

export default mongoose.model("Customer", UserSchema);
