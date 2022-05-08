import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import ReviewModel from "../models/Review.model";
import InvoiceModel from "../models/Invoice.model";
import ProductModel from "../models/Product.model";
import * as ErrorMessage from "../errors/error_message";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../errors";

const ratingProduct = async (productId: any, rating: any) => {
  let product = await ProductModel.findById(productId);

  product.productRating =
    (product.productRating * product.totalReview + rating) /
    (product.totalReview + 1);
  product.totalReview += 1;

  const result = await product.save();
  if (result) {
    return 1;
  } else {
    return 0;
  }
};

export const createReview = async (req: IUserRequest, res: Response) => {
  //Checking this invoice is valid or not
  let invoice = await InvoiceModel.findOne({
    _id: req.params.invoiceId,
    // "productList.productId": req.params.productId,
  });
  if (!invoice) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Checking valid product
  const product = invoice.productList.findIndex(
    (x: any) => String(x.product) == req.params.productId && x.isReview == 0,
  );
  if (!product) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  }

  //Checking user of this review
  const { userId } = req.user!;
  if (userId != invoice.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  }

  //Create review
  const review = await ReviewModel.create({
    user: userId,
    invoice: req.params.invoiceId,
    product: req.params.productId,
    ...req.body,
  });

  if (review) {
    invoice.productList[product].isReview = 1;
    await invoice.save();
    await ratingProduct(req.params.productId, req.body.productRating);
    res.status(StatusCodes.CREATED).json({ review });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }

  // //Remove duplicate productId
  // const seen = new Set();
  // const filteredArr = productListReq.filter((el: any) => {
  //   const duplicate = seen.has(el.productId);
  //   seen.add(el.productId);
  //   return !duplicate;
  // });
};
