import { StatusCodes } from "http-status-codes";
import {} from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import ProductModel from "../models/Product.model";

//Checking product is valid or not
const validProduct = async (productId: String, shopId: String) => {
  const product = await ProductModel.find({
    _id: productId,
    shopId: shopId,
    productStatus: 1,
  }).lean();

  if (product) {
    return 1;
  } else {
    return 0;
  }
};

const createOrder = async () => {};

export { createOrder };
