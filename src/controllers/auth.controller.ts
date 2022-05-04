import User from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import {
  sendForgetPasswordEmail,
  sendResetPasswordConfirmEmail,
  sendVerifyEmail,
} from "../utils/sendMail";
import UserModel from "../models/User.model";
import * as ErrorMessage from "../errors/error_message";
import {OAuth2Client} from "google-auth-library"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

const register = async (req: Request, res: Response) => {
  const user = await User.create({
    ...req.body,
  });
  await user.createRefreshToken();
  await user.hashPassword();
  await user.save();

  //send email for verification - need to differentiate google auth and email auth
  sendVerifyEmail(req.body.customerEmail, user._id, user.refreshToken);

  res.status(StatusCodes.CREATED).json({
    userId: user._id,
    email: req.body.customerEmail,
    msg: "Account created! Need verify email",
  });
};

const login = async (req: Request, res: Response) => {
  const { customerEmail, customerPassword } = req.body;

  if (!customerEmail || !customerPassword) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  const user = await User.findOne({ customerEmail });

  //Checking email
  if (!user) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  //checking password
  const isPasswordCorrect = await user.comparePassword(customerPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  if (user.customerStatus !== 1) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      userId: user._id,
      msg: ErrorMessage.ERROR_ACCOUNT_INACTIVED,
    });
  }

  //create JWT for authentication
  const token = user.createJWT();
  const refreshToken = await user.createRefreshToken();
  await user.save();

  const userObj = Object.assign({}, user._doc);
  delete userObj.customerPassword;
  delete userObj.authenToken;
  delete userObj.refreshToken;

  res.status(StatusCodes.OK).json({ user: userObj, token, refreshToken });
};

const loginWithToken = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  const user = await User.find(
    { _id: userId },
    { customerPassword: 0, authenToken: 0 },
  );

  if (!user) {
    return new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  res.status(StatusCodes.OK).json({ user: user[0] });
};

const verifyEmailCode = async (req: Request, res: Response) => {
  const { userId, verifyCode } = req.query;

  const user = await User.findById(userId);
  if (user.verifyToken(verifyCode)) {
    user.customerStatus = 1;
    await user.save();
    return res.status(StatusCodes.OK).json({ msg: "Verify successfully!" });
  }

  throw new UnauthenticatedError(ErrorMessage.ERROR_FAILED);
};

const resendVerifyEmail = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const user = await User.findById(userId);

  if (!user || !userId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  if (user.customerStatus === 1) {
    return res.status(StatusCodes.OK).json({
      msg: "Account has already verified!",
    });
  }

  await user.createRefreshToken();
  await user.save();

  sendVerifyEmail(user.customerEmail, user._id, user.refreshToken);
  res.status(StatusCodes.OK).json({
    msg: "Verify email sent!",
  });
};

const forgetPasswordEmail = async (req: Request, res: Response) => {
  const { customerEmail } = req.body;
  const user = await User.findOne({ customerEmail });

  if (!user) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  await user.createRefreshToken();
  await user.save();

  sendForgetPasswordEmail(customerEmail, user._id, user.refreshToken);
  res.status(StatusCodes.OK).json({
    msg: "Verify email sent!",
  });
};

const resetForgetPassword = async (req: Request, res: Response) => {
  const { userId, verifyCode, newPassword } = req.body;
  const user = await User.findById(userId);
  if (user.verifyToken(verifyCode)) {
    user.customerPassword = newPassword;
    await user.hashPassword();
    await user.save();
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Reset password successfully!" });
  } else {
    throw new UnauthenticatedError(ErrorMessage.ERROR_FAILED);
  }
};

const resetPassword = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const { newPassword } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  user.customerPassword = newPassword;
  await user.hashPassword();
  await user.save();

  sendResetPasswordConfirmEmail(user.customerEmail);
  return res.status(StatusCodes.OK).json({
    msg: "Reset password successfully, email confirm sent!",
  });
};

export {
  register,
  login,
  loginWithToken,
  verifyEmailCode,
  resendVerifyEmail,
  forgetPasswordEmail,
  resetForgetPassword,
  resetPassword,
};

// export const googleLogin = async (req: Request, res: Response) => {
//   const { customerName, googleId, customerEmail, customerAvatar } = req.body;

//   if (!customerName || !googleId || !customerEmail) {
//     throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
//   }

//   let user = await UserModel.findOne({ customerEmail });
//   if (!user) {
//     user = new UserModel();
//     await user.createAccountWithGoogleID(
//       customerName,
//       googleId,
//       customerEmail,
//       customerAvatar,
//     );
//   } else {
//     if (user.doesAccountCreatedWithGoogle()) {
//       //Compare this googleId with googleId in db
//       if (!user.verifyGoogleID(googleId)) {
//         throw new UnauthenticatedError(ErrorMessage.ERROR_GOOGLE_INVALID);
//       }
//     } else {
//       await user.updateAccountWithGoogle(googleId, customerAvatar);
//     }
//   }

//   const accessToken = user.createJWT();
//   const refressToken = await user.createRefreshToken();
//   const userObj = JSON.parse(JSON.stringify(user));
//   delete userObj.customerPassword;
//   delete userObj.authenToken;
//   delete userObj.refreshToken;

//   res.status(StatusCodes.OK).json({ user: userObj, accessToken, refressToken });
// };

export const googleLogin = async (req: Request, res: Response) => {
  const client = new OAuth2Client(CLIENT_ID);
  const token = req.body.tokenId;
  if(!token) {
    throw new BadRequestError(ErrorMessage.ERROR_GOOGLE_INVALID)
  }
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload()!;
  const userid = payload["sub"];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  res.json(userid);
};