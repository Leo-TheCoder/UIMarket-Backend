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
import UserModel from "../models/User.model";

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
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { shopId: newShop._id },
      { new: true },
    );

    const token = user.createJWT();

    res.status(StatusCodes.CREATED).json({ newShop, token });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Create shop failed");
  }
};

const uploadProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError("Invalid credential");
  }

  const product = await ProductModel.create({ ...req.body, shopId: shopId });

  if (product) {
    res.status(StatusCodes.CREATED).json({ product });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const deleteProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({ _id: req.params.productId });

  if (!shopId) {
    throw new UnauthenticatedError("Invalid credential");
  } else if (!product) {
    throw new BadRequestError("Invalid product Id");
  } else if (shopId != product.shopId) {
    throw new ForbiddenError("Only owner of this shop can do this action");
  } else if (product.productStatus === 0) {
    throw new GoneError("This product has already deleted");
  }

  product.productStatus = 0;
  product.updatedAt = new Date();

  const result = await product.save();

  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const updateProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({
    _id: req.params.productId,
    productStatus: 1,
  });

  if (!shopId) {
    throw new UnauthenticatedError("Invalid credential");
  } else if (!product) {
    throw new BadRequestError("Invalid product Id");
  } else if (shopId != product.shopId) {
    throw new ForbiddenError("Only owner of this shop can do this action");
  }

  product.productName = req.body.productName || product.productName;
  product.productPrice = req.body.productPrice || product.productPrice;
  product.productDescription =
    req.body.productDescription || product.productDescription;
  product.productPicture = req.body.productPicture || product.productPicture;
  product.updatedAt = new Date();

  const result = await product.save();
  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Updated failed");
  }
};

const getAllProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError("Invalid credential");
  }

  const product = await ProductModel
    //
    .find({ shopId: shopId })
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();
  console.log(product[0].createdAt.toString());
  res.status(StatusCodes.OK).json({ product });
};

const updateShop = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError("Invalid credential");
  }

  const shop = await ShopModel.findOne({ _id: shopId, shopStatus: 1 });

  shop.shopDescription = req.body.shopDescription || shop.shopDescription;
  shop.shopPhone = req.body.shopPhone || shop.shopPhone;
  shop.shopEmail = req.body.shopEmail || shop.shopEmail;
  shop.updatedAt = new Date();

  const result = await shop.save();
  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Update failed");
  }
};

export {
  createShop,
  updateShop,
  uploadProduct,
  deleteProduct,
  updateProduct,
  getAllProduct,
};
