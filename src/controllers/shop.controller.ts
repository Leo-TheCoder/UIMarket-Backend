import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Shop from "../models/Shop.model";
import * as Constants from "../constants";
import ShopModel from "../models/Shop.model";
import ProductModel from "../models/Product.model";
import CategoryModel from "../models/Category.model";
import UserModel from "../models/User.model";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";
import * as ErrorMessage from "../errors/error_message";
import InvoiceModel from "../models/Invoice.model";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

export const createShop = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const shop = await Shop.findOne({ userId: userId }).lean();

  if (shop) {
    if (shop.shopStatus == 0) {
      throw new GoneError(ErrorMessage.ERROR_GONE);
    } else {
      throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
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
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const uploadProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  const { productCategory } = req.body;
  if (!productCategory) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }
  const category = await CategoryModel.findById(productCategory);
  if (!category) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_CATEGORY_ID);
  }

  const product = await ProductModel.create({ ...req.body, shopId: shopId });

  if (product) {
    category.totalProduct += 1;
    await category.save();

    res.status(StatusCodes.CREATED).json({ product });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const deleteProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({ _id: req.params.productId });

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  } else if (!product) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  } else if (shopId != product.shopId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (product.deleteFlagged == 1) {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }

  product.productStatus = 0;
  product.deleteFlagged = 1;
  product.updatedAt = new Date();

  const result = await product.save();

  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const updateProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({
    _id: req.params.productId,
    productStatus: 1,
  });

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  } else if (!product) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  } else if (shopId != product.shopId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
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
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const getAllProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  const products = await ProductModel
    //
    .find({ shopId: shopId })
    .populate({ path: "productCategory", select: ["categoryName"] })
    .lean();

  res.status(StatusCodes.OK).json({ products });
};

export const updateShop = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }

  const shop = await ShopModel.findOne({ _id: shopId, shopStatus: 1 });

  shop.shopDescription = req.body.shopDescription || shop.shopDescription;
  shop.shopPhone = req.body.shopPhone || shop.shopPhone;
  shop.shopEmail = req.body.shopEmail || shop.shopEmail;
  shop.shopPayPal = req.body.shopPayPal || shop.shopPayPal;
  shop.updatedAt = new Date();

  const result = await shop.save();
  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const getShopById = async (req: IUserRequest, res: Response) => {
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
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
  } else {
    res.status(StatusCodes.OK).json({ shop });
  }
};

export const getShopByName = async (req: IUserRequest, res: Response) => {
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

  if (totalShop.length < 1) {
    return res.status(StatusCodes.OK).json({
      totalPages: 0,
      page,
      limit,
      shops: [],
    });
  }
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

export const deactiveProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({
    _id: req.params.productId,
    deleteFlagged: 0,
  });

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  } else if (!product) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  } else if (shopId != product.shopId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (product.productStatus == 0) {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }

  product.productStatus = 0;
  product.updatedAt = new Date();

  const result = await product.save();

  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const activeProduct = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;
  const product = await ProductModel.findOne({
    _id: req.params.productId,
    deleteFlagged: 0,
  });

  if (!shopId) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  } else if (!product) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  } else if (shopId != product.shopId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (product.productStatus == 1) {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }

  product.productStatus = 1;
  product.updatedAt = new Date();

  const result = await product.save();

  if (result) {
    res.status(StatusCodes.OK).json({ result });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

const getRevenue = async (invoices: any, productId: any) => {
  var revenue = 0;

  for (let i = 0; i < invoices.length; i++) {
    var product = invoices[i].productList.find(
      (x: any) => String(x.product) == String(productId),
    );
    revenue += product.productPrice;
  }
  return revenue;
};

export const getProductStatistic = async (req: IUserRequest, res: Response) => {
  //Get list of products
  const products = await ProductModel.find({
    shopId: req.user!.shopId,
    deleteFlagged: 0,
  }).select({ productFile: 0, deleteFlagged: 0, __v: 0 });

  const today = new Date();
  let L30D = new Date(today.getTime());
  L30D.setDate(L30D.getDate() - 30);

  var productList = [];

  for (let i = 0; i < products.length; i++) {
    var last30Days = { totalSold: 0, totalRevenue: 0 };
    var product = products[i]._doc;

    //Get list of invoice which have current product
    var invoices = await InvoiceModel.find({
      productList: { $elemMatch: { product: products[i]._id } },
    }).select({ productList: 1, _id: 0, createdAt: 1 });

    //Get all time revenue
    product.allTimeRevenue = await getRevenue(invoices, products[i]._id);

    // Get last 30 days sold and revenues
    var invoices_L30D = invoices.filter(
      (x: any) => x.createdAt <= today && x.createdAt >= L30D,
    );

    last30Days.totalSold = invoices_L30D.length;
    last30Days.totalRevenue = await getRevenue(invoices_L30D, products[i]._id);
    product.last30Days = last30Days;

    productList.push(product);
  }

  return res.status(StatusCodes.OK).json(productList);
};
