import User from "../models/User";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";

import { Request, Response } from "express";

const register = async (req: Request, res: Response) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({ user: { name: user._customer_Name }, token });
};

const login = async (req: Request, res: Response) => {
  const { _customer_Email, _customer_Password } = req.body;

  if (!_customer_Email || !_customer_Password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ _customer_Email });
  
  if(!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  //checking password
  const isPasswordCorrect = await user.comparePassword(_customer_Password);
  if(!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();
  res.status(StatusCodes.OK).json({user: {name: user._customer_Name}, token});
};

export {register, login};