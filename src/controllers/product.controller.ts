import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import ProductModel from "../models/Product.model";
import CategoryModel from "../models/Category.model";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  NotFoundError,
} from "../errors";

interface IQuery {
  page?: string;
  limit?: string;
}

const findByCategory = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  //Checking valid category
  const category = await CategoryModel.findById(req.params.categoryId).lean();
  if (!category) {
    throw new NotFoundError("Invalid category");
  }

  //Get total product
  const total = await ProductModel.countDocuments({
    productCategory: req.params.categoryId,
    productStatus: 1,
  }).lean();
  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const products = await ProductModel
    //
    .find({
      productCategory: req.params.categoryId,
      productStatus: 1,
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products,
  });
};

const findById = async (req: Request, res: Response) => {
  const product = await ProductModel.find({
    _id: req.params.productId,
    productStatus: 1,
  }).lean();

  if (!product) {
    throw new NotFoundError("Invalid product Id");
  } else {
    res.status(StatusCodes.OK).json({ product });
  }
};

const findByName = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const totalProduct = await ProductModel.aggregate([
    {
      $search: {
        index: "productName",
        text: {
          path: "productName",
          query: decodeURIComponent(req.params.productName),
        },
      },
    },
    { $match: { productStatus: 1 } },
    { $count: "total" },
  ]);
  const total = totalProduct[0].total;

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const product = await ProductModel.aggregate([
    {
      $search: {
        index: "productName",
        text: {
          path: "productName",
          query: decodeURIComponent(req.params.productName),
        },
      },
    },
    { $match: { productStatus: 1 } },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "productCategory",
        foreignField: "_id",
        pipeline: [{ $project: { categoryName: 1 } }],
        as: "productCategory",
      },
    },
    {
      $lookup: {
        from: "shops",
        localField: "shopId",
        foreignField: "_id",
        pipeline: [{ $project: { shopName: 1 } }],
        as: "shop",
      },
    },
  ]);

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    product,
  });
};

export {
  findByCategory,
  findById,
  findByName,
  //
};
