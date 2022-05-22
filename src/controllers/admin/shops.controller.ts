import { Request, Response } from "express";
import * as Constants from "../../constants";
import { StatusCodes } from "http-status-codes";
import ShopModel from "../../models/Shop.model";
import { IUserRequest } from "../../types/express";
import { BadRequestError } from "../../errors";
import * as ErrorMessage from "../../errors/error_message";

interface IQuery {
  page?: string;
  limit?: string;
  sort?: SortTypes;
  filter?: FilterTypes;
}

enum SortTypes {
  OLDEST = "oldest",
  NEWEST = "newest",
}

const sortObjMongoose = (sort?: SortTypes) => {
  switch (sort) {
    case SortTypes.OLDEST:
      return { createdAt: 1 };
    case SortTypes.NEWEST:
      return { createdAt: -1 };
    default:
      return {};
  }
};

enum FilterTypes {}

const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    default:
      return {};
  }
};

const projectionShopList = {
  __v: 0,
};

export const getAllShops = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  const total = await ShopModel.countDocuments({
    ...filterObj,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const shops = await ShopModel.find(
    {
      ...filterObj,
    },
    projectionShopList
  )
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    // .populate({ path: "productCategory", select: ["categoryName"] })
    // .populate({ path: "shopId", select: ["shopName"] })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    shops,
  });
};

export const deactiveShop = async (req: IUserRequest, res: Response) => {
  const {shopId} = req.params;
  const shop = await ShopModel.findById(shopId, {
    shopStatus: 1,
  });

  if (!shop) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  //Deactivate shop
  shop.shopStatus = 0;
  await shop.save();

  return res.status(StatusCodes.OK).json({
    shop,
  });
}

export const activeShop = async (req: IUserRequest, res: Response) => {
  const {shopId} = req.params;
  const shop = await ShopModel.findById(shopId, {
    shopStatus: 0,
  });

  if (!shop) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  //Activate shop
  shop.shopStatus = 1;
  await shop.save();

  return res.status(StatusCodes.OK).json({
    shop,
  });
}