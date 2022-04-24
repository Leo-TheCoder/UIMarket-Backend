import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Shop from "../models/Shop.model";
import * as Constants from "../constants";
import ShopModel from "../models/Shop.model";
import ProductModel from "../models/Product.model";
import UserModel from "../models/User.model";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  NotFoundError,
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

  const products = await ProductModel
    //
    .find({ shopId: shopId })
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();
  console.log(products[0].createdAt.toString());
  res.status(StatusCodes.OK).json({ products });
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

const getShopById = async (req: IUserRequest, res: Response) => {
  var selectOption: any = { __v: 0 };

  if (!req.user?.shopId || req.user.shopId != req.params.shopId) {
    selectOption.shopIDCard = 0;
    selectOption.shopBalance = 0;
    selectOption.userId = 0;
    selectOption.taxCode = 0;
  }

  const shop = await ShopModel.find({
    _id: req.params.shopId,
    shopStatus: 1,
  })
    .select(selectOption)
    .lean();

  if (!shop) {
    throw new NotFoundError("Invalid Shop ID");
  } else {
    res.status(StatusCodes.OK).json({ shop });
  }
};

const getShopByName = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;
  const selectOption = {
    __v: 0,
    shopIDCard: 0,
    shopBalance: 0,
    userId: 0,
    taxCode: 0,
  };

  const totalShop = await ShopModel.aggregate([
    {
      $search: {
        index: "shopName",
        text: {
          path: "shopName",
          query: decodeURIComponent(req.params.shopName),
        },
      },
    },
    { $match: { shopStatus: 1 } },
    { $count: "total" },
  ]);
  const total = totalShop[0].total;

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const shops = await ShopModel.aggregate([
    {
      $search: {
        index: "shopName",
        text: {
          path: "shopName",
          query: decodeURIComponent(req.params.shopName),
        },
      },
    },
    { $match: { shopStatus: 1 } },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: selectOption },
  ]);

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    shops,
  });
};

export {
  createShop,
  updateShop,
  uploadProduct,
  deleteProduct,
  updateProduct,
  getAllProduct,
  getShopById,
  getShopByName,
};
