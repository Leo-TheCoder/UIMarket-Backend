import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import CategoryModel from "../models/Category.model";
import { InternalServerError } from "../errors";
import * as ErrorMessage from "../errors/error_message";

const createCategory = async (req: Request, res: Response) => {
  const category = await CategoryModel.create({ ...req.body });

  if (category) {
    res.status(StatusCodes.CREATED).json({ category });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

const getAllCategory = async (req: Request, res: Response) => {
  const categories = await CategoryModel.find({ categoryStatus: 1 }).lean();

  res.status(StatusCodes.OK).json({ categories });
};

export { createCategory, getAllCategory };
