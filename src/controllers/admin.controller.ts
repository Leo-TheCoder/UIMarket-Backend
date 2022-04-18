import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import CategoryModel from "../models/Category.model";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";

const createCategory = async (req: Request, res: Response) => {
  const category = await CategoryModel.create({ ...req.body });

  if (category) {
    res.status(StatusCodes.CREATED).json({ category });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getAllCategory = async (req: Request, res: Response) => {
  const categories = await CategoryModel.find({ categoryStatus: 1 });

  res.status(StatusCodes.OK).json({ categories });
};

export { createCategory, getAllCategory };
