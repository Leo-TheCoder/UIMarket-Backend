import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import * as ErrorMessage from "../errors/error_message";
import ProductModel from "../models/Product.model";
import InvoiceModel from "../models/Invoice.model";

//Checking product is valid or not
const validProduct = async (productId: String, shopId: any) => {
  let product = await ProductModel.findOne({
    _id: productId,
    // shopId: shopId,
    productStatus: 1,
  })
    .populate({ path: "shopId", select: "shopName" })
    .select("productPrice productName")
    .lean();

  if (product) {
    return product;
  } else {
    return -1;
  }
};

export const preOrder = async (req: IUserRequest, res: Response) => {
  let { productList } = req.body;
  var invoiceTotal = 0;

  if (!productList) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Remove duplicate out of array
  productList = productList.filter(
    (value: any, index: any, self: any) =>
      index ===
      self.findIndex(
        (t: any) => t.product === value.product && t.shop === value.shop,
      ),
  );

  //Checking product and get its price
  for (let i = 0; i < productList.length; i++) {
    var product = await validProduct(
      productList[i].product,
      productList[i].shop,
    );
    if (product.productPrice >= 0) {
      invoiceTotal += product.productPrice;

      productList[i].shopName = product.shopId.shopName;
      productList[i].productName = product.productName;
      productList[i].productPrice = product.productPrice;
    } else {
      throw new NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }
  }

  res.status(StatusCodes.OK).json({ productList, invoiceTotal });
};

export const createOrder = async (req: IUserRequest, res: Response) => {
  const { productList } = req.body;
  const { userId } = req.user!;

  if (!productList) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Checking transactionId
  //Do sth here

  //Create invoice
  let invoice = await InvoiceModel.create({
    ...req.body,
    userId: userId,
  });

  //Increase total sold by 1
  if (invoice) {
    productList.forEach(async (product: any) => {
      let result = await ProductModel.updateOne(
        { _id: product.product },
        { $inc: { totalSold: 1 } },
      );
    });
  }

  res.status(StatusCodes.CREATED).json({ invoice });
};
