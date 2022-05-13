//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import ProductModel from "../models/Product.model";
import CartModel from "../models/Cart.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import {
  BadRequestError,
  GoneError,
  InternalServerError,
  NotFoundError,
} from "../errors";

interface IQuery {
  page?: string;
  limit?: string;
}

export const addProduct = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const productId = req.body.product;
  if (!productId) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Checking valid product
  const product = await ProductModel.find({
    _id: productId,
    productStatus: 1,
  }).lean();

  if (!product) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  }

  //Checking if this product in cart or not
  const oldCart = await CartModel.findOne({
    userId: userId,
    productId: productId,
  });

  if (oldCart) {
    throw new BadRequestError(ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE);
  }

  const cart = await CartModel.create({
    ...req.body,
    userId: userId,
  });

  if (cart) {
    res.status(StatusCodes.CREATED).json(cart);
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const viewCart = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await CartModel.countDocuments({ userId: userId }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const cart = await CartModel.find({ userId: userId })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "product", select: ["productName", "productPrice"] })
    .lean();

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    cart,
  });
};

export const removeFromCart = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  const cart = await CartModel.findOneAndRemove({
    userId: userId,
    product: req.params.productId,
  });

  if (cart) {
    res.status(StatusCodes.OK).json(cart);
  } else {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }
};
