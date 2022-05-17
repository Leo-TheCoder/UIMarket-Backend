//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import ReviewModel from "../models/Review.model";
import InvoiceModel from "../models/Invoice.model";
import ProductModel from "../models/Product.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../errors";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

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
    invoiceStatus: "Paid",
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
};

export const getProductReviews = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReviewModel.countDocuments({
    product: req.params.productId,
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reviews = await ReviewModel.find({ product: req.params.productId })
    .skip((page - 1) * limit)
    .limit(limit)
    .select({ invoice: 0 })
    .populate({ path: "user", select: "customerName customerAvatar" })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    reviews,
  });
};

export const updateReview = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //Checking if this review exist or not
  const review = await ReviewModel.findById(req.params.reviewId);
  if (!review) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_REVIEW_ID);
  }

  //Checking if user of this review
  if (userId != review.user) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  }

  //Checking request body
  const newRating = req.body.productRating;
  const newReview = req.body.productReview;
  const newPicture = req.body.reviewPictures;
  if (!newRating || !newReview || !newPicture) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Get product of this review
  const product = await ProductModel.findById(review.product);
  const oldRating = review.productRating;

  //Checking productRating is changed or not
  if (newRating != oldRating) {
    product.productRating =
      product.productRating + (newRating - oldRating) / product.totalSold;
    await product.save();
  }

  //Update review
  review.productReview = newReview;
  review.productRating = newRating;
  review.reviewPictures = newPicture;
  review.updatedAt = new Date();
  const result = await review.save();

  res.status(StatusCodes.OK).json(result);
};
