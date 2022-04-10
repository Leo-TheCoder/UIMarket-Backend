import User from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import { sendForgetPasswordEmail, sendResetPasswordConfirmEmail, sendVerifyEmail } from "../utils/sendMail";
import { resolveSoa } from "dns";

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
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ customerEmail });

  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  //checking password
  const isPasswordCorrect = await user.comparePassword(customerPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  if (user.customerStatus !== 1) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      userId: user._id,
      msg: "Account isn't active!",
    });
  }

  //create JWT for authentication
  const token = user.createJWT();

  const userObj = Object.assign({}, user._doc);
  delete userObj.customerPassword;
  delete userObj.authenToken;

  res.status(StatusCodes.OK).json({ user: userObj, token });
};

const loginWithToken = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  const user = await User.find(
    { _id: userId },
    { customerPassword: 0, authenToken: 0 }
  );

  if (!user) {
    return new UnauthenticatedError("User not found!");
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

  return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Verify fail!" });
};

const resendVerifyEmail = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const user = await User.findById(userId);

  if (!user || !userId) {
    throw new UnauthenticatedError("Invalid Account");
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
  const { email } = req.body;
  const user = await User.findOne({ customerEmail: email });

  if (!user) {
    throw new UnauthenticatedError("Invalid Account!");
  }

  await user.createRefreshToken();
  await user.save();

  sendForgetPasswordEmail(email, user._id, user.refreshToken);
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
  }

  return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Verify fail!" });
};

const resetPassword = async (req: IUserRequest, res: Response) => {
  const {userId} = req.user!;
  const {newPassword} = req.body;
  const user = await User.findById(userId);

  if(!user) {
    throw new UnauthenticatedError("Invalid Account");
  }

  user.customerPassword = newPassword;
  await user.hashPassword();
  await user.save();

  sendResetPasswordConfirmEmail(user.customerEmail);
  return res.status(StatusCodes.OK).json({
    msg: "Reset password successfully, email confirm sent!",
  })
}

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
