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
  //Checking this invoice is reviewed or not
  const invoice = await InvoiceModel.findOne({
    _id: req.params.invoiceId,
    invoiceStatus: "Paid",
  });

  if (!invoice) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Checking user of this review
  const { userId } = req.user!;
  if (userId != invoice.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  }

  //Checking body
  const { productList } = invoice;
  const productListReq = req.body.productList;

  if (!productListReq) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Remove duplicate productId
  const seen = new Set();
  const filteredArr = productListReq.filter((el: any) => {
    const duplicate = seen.has(el.productId);
    seen.add(el.productId);
    return !duplicate;
  });

  for (let i = 0; i < productList.length; i++) {
    let product = String(productList[i].product);
    let productReq = filteredArr.find((x: any) => x.productId === product);

    let content = " ";
    let rating = 5;
    let picture = [];

    if (productReq) {
      content = productReq.review;
      rating = productReq.rating;
      picture = productReq.picture;
    }

    //Create review
    const review = await ReviewModel.create({
      user: userId,
      invoice: req.params.invoiceId,
      product: product,
      productReview: content,
      productRating: rating,
      reviewPicture: picture,
    });

    if (review) {
      const result = await ratingProduct(product, rating);
      if (result == 0) {
        throw new InternalServerError(ErrorMessage.ERROR_FAILED);
      }
    }
  }

  invoice.invoiceStatus = "Reviewed";
  const result = await invoice.save();

  res.status(StatusCodes.CREATED).json({ result });
};
