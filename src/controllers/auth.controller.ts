import User from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";

import { Request, Response } from "express";
import { IUserRequest } from "../types/express";

const register = async (req: Request, res: Response) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();

  res
    .status(StatusCodes.CREATED)
    .json({ user: { name: user.customerName, isActive: true }, token });
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

  //create JWT for authentication
  const token = user.createJWT();

  //checking status
  const isActive = user.customerStatus === 1;

  res
    .status(StatusCodes.OK)
    .json({ user: { name: user.customerName, isActive }, token });
};

const loginWithToken = async (req: IUserRequest, res: Response) => {
  const {userId} = req.user!;

  const user = await User.find({_id: userId}, {customerPassword: 0, authenToken: 0});

  if(!user) {
    return new UnauthenticatedError("User not found!");
  }

  res.status(StatusCodes.OK).json({user: user[0]});
}

export { register, login, loginWithToken };
