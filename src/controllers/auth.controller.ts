import User from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import randomstring from "randomstring";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import { sendVerifyEmail } from "../utils/sendMail";

const register = async (req: Request, res: Response) => {
  const user = await User.create({
    ...req.body,
    refreshToken: randomstring.generate(30),
  });

  //send email for verification - need to differentiate google auth and email auth 
  sendVerifyEmail(req.body.customerEmail, user._id, user.refreshToken);

  res.status(StatusCodes.CREATED).json({msg: "Account created! Need verify email"});
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

  if(user.customerStatus !== 1) {
    throw new UnauthenticatedError("Account is not active");
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
  if (verifyCode === user.refreshToken) {
    user.customerStatus = 1;
    await user.save();
    return res.status(StatusCodes.OK).json({ msg: "Verify successfully!" });
  }

  return res.status(StatusCodes.UNAUTHORIZED).json({msg: "Verify fail!"});
};

export { register, login, loginWithToken, verifyEmailCode };
