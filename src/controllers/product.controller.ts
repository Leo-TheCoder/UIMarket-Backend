import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import * as Constants from "../constants";
import ProductModel from "../models/Product.model";
import CategoryModel from "../models/Category.model";
import { NotFoundError } from "../errors";
import ShopModel from "../models/Shop.model";
import * as ErrorMessage from "../errors/error_message";

enum SortTypes {
  MoneyAsc = "money-asc",
  MoneyDes = "money-des",
  NameAsc = "name-asc",
  NameDes = "name-des",
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
    projectionProductList
  )
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();

  const productsResult = products.map((product) => {
    //get first picture
    product.productPicture = product.productPicture[0];
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
    { $match: { productStatus: 1 , ...filterObj} },
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
    { $match: { productStatus: 1, ...filterObj } },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $sort: sortObj},
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

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products,
  });
};

export {
  findByCategory,
  findById,
  findByName,
  getProductsByShop,
  //
};
