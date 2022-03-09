import User from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";

import { Request, Response } from "express";

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

export { register, login };
