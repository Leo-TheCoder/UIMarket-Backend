//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import ProductModel from "../models/Product.model";
import InvoiceModel from "../models/Invoice.model";

//Error
import { BadRequestError, NotFoundError } from "../errors";
import * as ErrorMessage from "../errors/error_message";

interface IQuery {
  page?: string;
  limit?: string;
}
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

export const preOrder = async (req: IUserRequest) => {
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

export const paidInvoice = async (invoiceId: any, transactionId: any) => {
  //Checking if has transaction Id

  //Checking invoice
  const invoice = await InvoiceModel.findByIdAndUpdate(
    invoiceId,
    {
      transactionId: transactionId,
      invoiceStatus: "Paid",
    },
    { new: true },
  );

  if (!invoice) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  } else {
    //Increase total sold by 1
    invoice.productList.forEach(async (product: any) => {
      let result = await ProductModel.updateOne(
        { _id: product.product },
        { $inc: { totalSold: 1 } },
      );
    });

    return invoice;
  }
};

export const purchaseHistory = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await InvoiceModel.find({
    invoiceStatus: "Paid",
    userId: userId,
  }).count();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get invoice
  const invoices = await InvoiceModel.find({
    invoiceStatus: "Paid",
    userId: userId,
  })
    .select({ productList: 1, _id: 0 })
    .skip((page - 1) * limit)
    .limit(limit)
    // .populate({ path: "productList.product", select: "productName -_id" })
    .lean();

  res.status(StatusCodes.OK).json({ invoices });
};
