import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import * as Constants from "../constants";
import ProductModel from "../models/Product.model";
import CategoryModel from "../models/Category.model";
import { NotFoundError } from "../errors";
import ShopModel from "../models/Shop.model";
import * as ErrorMessage from "../errors/error_message";
import { getShopById } from "./shop.controller";
import { IUserRequest } from "../types/express";

enum SortTypes {
  MoneyAsc = "money-asc",
  MoneyDes = "money-des",
  NameAsc = "name-asc",
  NameDes = "name-des",
  SoldAsc = "sold-asc",
  SoldDes = "sold-des",
}

enum FilterTypes {
  PRICE_FREE = "money-free",
  PRICE_0_19 = "money-0-19",
  PRICE_20_39 = "money-20-39",
  PRICE_40_59 = "money-40-59",
  PRICE_60_79 = "money-60-79",
  PRICE_80 = "money-80",
}
interface IQuery {
  page?: string;
  limit?: string;
  sort?: SortTypes;
  filter?: FilterTypes;
}

const sortObjMongoose = (sort?: SortTypes): any => {
  if (sort === SortTypes.MoneyAsc) {
    return { productPrice: 1 };
  }
  if (sort === SortTypes.MoneyDes) {
    return { productPrice: -1 };
  }
  if (sort === SortTypes.NameAsc) {
    return { productName: 1 };
  }
  if (sort === SortTypes.NameDes) {
    return { productName: -1 };
  }
  if (sort === SortTypes.SoldAsc) {
    return { totalSold: 1 };
  }
  if (sort === SortTypes.SoldDes) {
    return { totalSold: -1 };
  }
  return {};
};

const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    case FilterTypes.PRICE_FREE:
      return { productPrice: 0 };
    case FilterTypes.PRICE_0_19:
      return { productPrice: { $gt: 0, $lte: 19 } };
    case FilterTypes.PRICE_20_39:
      return { productPrice: { $gte: 20, $lte: 39 } };
    case FilterTypes.PRICE_40_59:
      return { productPrice: { $gte: 40, $lte: 59 } };
    case FilterTypes.PRICE_60_79:
      return { productPrice: { $gte: 60, $lte: 79 } };
    case FilterTypes.PRICE_80:
      return { productPrice: { $gte: 80 } };
    default:
      return {};
  }
};

const projectionProductList = {
  __v: 0,
  productDescription: 0,
  productFile: 0,
};

export const getAllProducts = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  const total = await ProductModel.countDocuments({
    productStatus: 1,
    ...filterObj,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const products = await ProductModel.find(
    {
      productStatus: 1,
      ...filterObj,
    },
    projectionProductList,
  )
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "productCategory", select: ["categoryName"] })
    .populate({ path: "shopId", select: ["shopName"] })
    .lean();

  const productsResult = products.map((product) => {
    //get first item in array
    const productPictureList = product.productPictures;
    //get first picture
    product.coverPicture = productPictureList
      ? productPictureList[0]
      : undefined;
    delete product.productPictures;
    return product;
  });

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsResult,
  });
};

const findByCategory = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  //Checking valid category
  const category = await CategoryModel.findById(req.params.categoryId).lean();
  if (!category) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_CATEGORY_ID);
  }

  //Get total product
  const total = await ProductModel.countDocuments({
    productCategory: req.params.categoryId,
    productStatus: 1,
    ...filterObj,
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
      ...filterObj,
    })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "productCategory", select: ["categoryName"] })
    .populate({ path: "shopId", select: ["shopName"] })
    .lean();

  const productsResult = products.map((product) => {
    //get first item in array
    const productPictureList = product.productPictures;
    //get first picture
    product.coverPicture = productPictureList
      ? productPictureList[0]
      : undefined;
    delete product.productPictures;
    return product;
  });

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsResult,
  });
};

const findById = async (req: IUserRequest, res: Response) => {
  const shopId = req.user?.shopId;
  let customerEmail = "null";
  if (shopId) {
    customerEmail = await ShopModel.findById(shopId).populate({
      path: "userId",
      select: "customerEmail -_id",
    });
  }

  const result = await ProductModel.findByIdAndUpdate(
    {
      _id: req.params.productId,
      productStatus: 1,
    },
    { $inc: { allTimeView: 1 } },
  ).populate({ path: "shopId", select: "shopEmail" });

  let product = result._doc;
  // console.log(product);
  product.customerEmail = customerEmail;
  // console.log(product);

  if (!result) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  } else {
    res.status(StatusCodes.OK).json({ product });
  }
};

const findByName = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

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
    { $match: { productStatus: 1, ...filterObj } },
    { $count: "total" },
  ]);

  if (totalProduct.length < 1) {
    return res.status(StatusCodes.OK).json({
      totalPages: 0,
      page,
      limit,
      products: [],
    });
  }
  const total = totalProduct[0].total;

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const products = await ProductModel.aggregate([
    {
      $search: {
        index: "productName",
        text: {
          path: "productName",
          query: decodeURIComponent(req.params.productName),
        },
      },
    },
    { $match: { productStatus: 1, ...filterObj } },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    // { $sort: sortObj}
    { $project: projectionProductList },
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

  const productsResult = products.map((product) => {
    //get first item in array
    const productPictureList = product.productPictures;
    //get first picture
    product.coverPicture = productPictureList
      ? productPictureList[0]
      : undefined;
    delete product.productPictures;
    product.productCategory = product.productCategory[0];
    product.shop = product.shop[0];
    return product;
  });

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsResult,
  });
};

const getProductsByShop = async (req: Request, res: Response) => {
  const shopId = req.params.shopId;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  //Check shop ID
  const shop = await ShopModel.find({ _id: shopId, shopStatus: 1 }).lean();
  if (!shop) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
  }

  //Get total product
  const total = await ProductModel.countDocuments({
    shopId: shopId,
    productStatus: 1,
    ...filterObj,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const products = await ProductModel.find({
    shopId: shopId,
    productStatus: 1,
    ...filterObj,
  })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();

  const productsResult = products.map((product) => {
    //get first item in array
    const productPictureList = product.productPictures;
    //get first picture
    product.coverPicture = productPictureList
      ? productPictureList[0]
      : undefined;
    delete product.productPictures;
    return product;
  });

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsResult,
  });
};

export {
  findByCategory,
  findById,
  findByName,
  getProductsByShop,
  //
};
