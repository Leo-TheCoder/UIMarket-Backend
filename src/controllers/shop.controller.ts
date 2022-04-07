import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Shop from "../models/Shop.model";
import * as Constants from "../constants";
import ShopModel from "../models/Shop.model";
import ProductModel from "../models/Product.model";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  UnauthenticatedError,
} from "../errors";

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

  const newShop = await ShopModel.create({
    ...req.body,
    userId: userId,
  });

  if (newShop) {
    res.status(StatusCodes.CREATED).json({ newShop });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Create shop failed");
  }
};

const uploadProduct = async (req: IUserRequest, res: Response) => {
  //Get ShopID
  const shop = await ShopModel.findOne({
    userId: req.user?.userId,
    shopStatus: 1,
  }).lean();

  if (!shop) {
    throw new UnauthenticatedError("Invalid credential");
  }

  const product = await ProductModel.create({ ...req.body, shopId: shop._id });

  if (product) {
    res.status(StatusCodes.CREATED).json({ product });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// const login = async (req: IUserRequest, res: Response) => {
//   const { userId } = req.user!;

//   const shop = await ShopModel.findOne({ userId: userId, shopStatus: 1 });

//   if (!shop) {
//     throw new NotFoundError("This user is not own a shop");
//   }

//   //create JWT for authentication
//   const token = shop.createJWT();
//   const shopObj = Object.assign({}, shop._doc);

//   res.status(StatusCodes.OK).json({ shop: shopObj, token });
// };

// const loginWithToken = async (req: IShopRequest, res: Response) => {
//   const { shopId } = req.shop!;

//   const shop = await ShopModel.findOne(
//     { _id: shopId, shopStatus: 1 },
//     { shopIDCard: 0 },
//   );

//   if (!shop) {
//     return new UnauthenticatedError("Shop not found!");
//   }

//   res.status(StatusCodes.OK).json({ shop });
// };

export {
  createShop,
  uploadProduct,
  // login,
  // loginWithToken
};
