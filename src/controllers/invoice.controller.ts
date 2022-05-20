//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import { ObjectId } from "mongodb";

//Model
import ProductModel from "../models/Product.model";
import InvoiceModel from "../models/Invoice.model";

//Error
import { BadRequestError, NotFoundError } from "../errors";
import * as ErrorMessage from "../errors/error_message";
import CartModel from "../models/Cart.model";
import LicenseModel from "../models/License.model";

interface IQuery {
  page?: string;
  limit?: string;
}

type Product = {
  product: string;
  shop: string;
  shopName: string;
  productName: string;
  productPrice: number;
};

//Checking product is valid or not
const validProduct = async (productId: string) => {
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

export const preOrder = async (req: IUserRequest) => {
  let productList = req.body.productList as Product[];
  let invoiceTotal = 0;

  if (!productList) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Remove duplicate out of array
  productList = productList.filter(
    (value: any, index: any, self: any) =>
      index === self.findIndex((t: any) => t.product === value.product),
  );

  //Checking product and get its price
  const productPromises = productList.map((productObj, index) => {
    return validProduct(productObj.product).then((_validProduct) => {
      if (_validProduct.productPrice >= 0) {
        invoiceTotal += _validProduct.productPrice;

        productList[index].shopName = _validProduct.shopId.shopName;
        productList[index].productName = _validProduct.productName;
        productList[index].productPrice = _validProduct.productPrice;
      }
    });
  });
  await Promise.all(productPromises);
  return { productList, invoiceTotal };
};

export const createOrder = async (req: IUserRequest) => {
  const { userId } = req.user!;
  const body = await preOrder(req);
  const { productList } = body;

  //Create invoice
  let invoice = await InvoiceModel.create({
    productList: productList,
    invoiceTotal: body.invoiceTotal,
    userId: userId,
  });

  return invoice;
};

export const paidInvoice = async (
  invoice: any,
  transactionId: any,
  userId: string,
) => {
  //Checking if has transaction Id

  //Checking invoice
  // const invoice = await InvoiceModel.findByIdAndUpdate(
  //   invoiceId,
  //   {
  //     transactionId: transactionId,
  //     invoiceStatus: "Paid",
  //   },
  //   { new: true }
  // ).lean();
  invoice.transactionId = transactionId;
  invoice.invoiceStatus = "Paid";
  await invoice.save();

  if (!invoice) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Increase total sold by 1
  invoice.productList.forEach((product: any) => {
    ProductModel.updateOne(
      { _id: product.product },
      { $inc: { totalSold: 1 } },
    ).catch((error) => {
      console.log(error);
    });

    CartModel.findOneAndRemove({
      userId,
      product: product.product,
    }).catch((error) => {
      console.log(error);
    });
  });

  return invoice;
};

export const purchaseHistory = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  // const userId = "62693a28052feac047bce72f";
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await LicenseModel.find({
    userId: userId,
  }).count();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product list
  const licenses = await LicenseModel.find({ userId: userId })
    .select("-licenseFile")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "product", select: "productPictures productFile" })
    .populate({ path: "shop", select: "shopName" })
    .populate({ path: "invoice", select: "productList" });

  let productsToResponse = [];
  for (let i = 0; i < licenses.length; i++) {
    let license = licenses[i]._doc;

    let isReview = license.invoice.productList.findIndex(
      (x: any) => String(x.product) == String(license.product._id),
    );

    license.product.productPictures = license.product.productPictures[0];
    license.isReview = license.invoice.productList[isReview].isReview;
    license.invoiceId = license.invoice._id;

    delete license.invoice;

    productsToResponse.push(license);
  }

  // const products = [];

  // for (let i = 0; i < invoices.length; i++) {
  //   const productList = invoices[i].productList;
  //   for (let j = 0; j < productList.length; j++) {
  //     products.push(productList[j]);
  //   }
  // }

  // const productsToResponse = products.map((product) => {
  //   const productPictureList = product.product.productPictures;
  //   const coverPicture =
  //     productPictureList && productPictureList.length > 0
  //       ? productPictureList[0]
  //       : undefined;

  //   return {
  //     productId: product.product._id,
  //     productFile: product.product.productFile,
  //     coverPicture,
  //     shop: product.shop,
  //     productName: product.productName,
  //     productPrice: product.productPrice,
  //     isReview: product.isReview,
  //     license: product.license,
  //   };
  // });
  // console.log(licenses[0]);

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsToResponse,
  });
};
