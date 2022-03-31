import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Shop from "../models/Shop.model";
import * as Constants from "../constants";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

const createShop = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const shop = await Shop.findOne({ userId: userId }).lean();

  if (shop) {
    if (shop.shopStatus == 0) {
      throw new GoneError("Your shop has been closed by some reasons");
    } else {
      throw new ForbiddenError("This user has already owned a shop");
    }
  }

  const newShop = await Shop.create({
    ...req.body,
    userId: userId,
  });

  if (newShop) {
    res.status(StatusCodes.CREATED).json({ newShop });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Create shop failed");
  }
};

export { createShop };
