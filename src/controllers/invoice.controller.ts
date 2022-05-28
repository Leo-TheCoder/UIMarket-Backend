//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import { LicesneStatusEnum, TransactionStatusEnum } from "../types/enum";
import { ShopTransaction } from "../types/object-type";

//Model
import ProductModel from "../models/Product.model";
import InvoiceModel from "../models/Invoice.model";
import CartModel from "../models/Cart.model";
import LicenseModel from "../models/License.model";

//Error
import { BadRequestError, NotFoundError } from "../errors";
import * as ErrorMessage from "../errors/error_message";
import ShopTransactionModel from "../models/ShopTransaction.model";

interface IQuery {
  page?: string;
  limit?: string;
  filter?: FilterTypes;
  sort?: SortTypes;
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
      index === self.findIndex((t: any) => t.product === value.product)
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
  transasctionPaypalId: string
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
  invoice.transactionPaypalId = transasctionPaypalId;
  await invoice.save();

  if (!invoice) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Increase total sold by 1
  invoice.productList.forEach((product: any) => {
    ProductModel.updateOne(
      { _id: product.product },
      { $inc: { totalSold: 1 } }
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

  const filterObj = {
    userId,
    licenseStatus: LicesneStatusEnum.ACTIVE,
  }

  const total = await LicenseModel.find(filterObj).count();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product list
  const licenses = await LicenseModel.find(filterObj)
    .select("-licenseFile")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "product",
      select: "productPictures productFile productName",
    })
    .populate({ path: "shop", select: "shopName" })
    .populate({ path: "invoice", select: "productList isRefunded" });

  let productsToResponse = [];
  for (let i = 0; i < licenses.length; i++) {
    let license = licenses[i]._doc;

    let isReview = license.invoice.productList.findIndex(
      (x: any) => String(x.product) == String(license.product._id)
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

export const searchPurchaseHistory = async (
  req: IUserRequest,
  res: Response
) => {
  const { userId } = req.user!;
  // const userId = "62693a28052feac047bce72f";
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const projectionObject = {
    licenseFile: 0,
  };

  const searchedProductIds = await ProductModel.aggregate([
    {
      $search: {
        index: "productName",
        text: {
          path: "productName",
          query: decodeURIComponent(req.params.productName),
        },
      },
    },
    {
      $project: { _id: 1 },
    },
  ]);

  const productIds = searchedProductIds.map((product) => product._id);

  const filterObject = {
    userId,
    product: { $in: productIds },
    licenseStatus: LicesneStatusEnum.ACTIVE,
  };

  const total = await LicenseModel.count(filterObject);

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const purchaseList = await LicenseModel.find(filterObject)
    .skip((page - 1) * limit)
    .limit(limit)
    .select(projectionObject)
    .populate({
      path: "product",
      select: "productPictures productFile productName",
    })
    .populate({ path: "shop", select: "shopName" })
    .populate({ path: "invoice", select: "productList isRefunded" })
    .lean();

  const productsToSend = purchaseList.map((license) => {
    const productReviewIndex = license.invoice.productList.findIndex(
      (x: any) => String(x.product) == String(license.product._id)
    );

    const resObj = {
      ...JSON.parse(JSON.stringify(license)),
      isReview: license.invoice.productList[productReviewIndex].isReview,
      invoiceId: license.invoice._id,
    };

    const pictures = license.product.productPictures;
    resObj.product.productPictures = pictures ? pictures[0] : undefined;

    delete resObj.invoice;
    return resObj;
  });

  return res
    .status(StatusCodes.OK)
    .json({ totalPages, page, limit, products: productsToSend });
};

enum FilterTypes {
  COMPLETED = "completed",
  PENDING = "pending",
  REFUNDED = "refunded",
}
enum SortTypes {
  NEWEST = "newest",
  OLDEST = "oldest",
}
const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    case FilterTypes.COMPLETED:
      return { transactionStatus: TransactionStatusEnum.COMPLETED };
    case FilterTypes.PENDING:
      return { transactionStatus: TransactionStatusEnum.PENDING };
    case FilterTypes.REFUNDED:
      return { transactionStatus: TransactionStatusEnum.REFUNDED };
    default:
      return {};
  }
};
const sortObjMongoose = (sort?: SortTypes) => {
  switch (sort) {
    case SortTypes.OLDEST:
      return { createdAt: 1 };
    case SortTypes.NEWEST:
      return { createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

export const getShopTransaction = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.user!;

  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);
  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filterObject = {
    shopId,
    ...filterObj
  };
  const projectionObject = {
    _id: 1,
    productId: 1,
    action: 1,
    changeAmount: 1,
    transactionStatus: 1,
    updatedAt: 1,
    createdAt: 1,
  };

  const total = await ShopTransactionModel.count(filterObject);

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const transactions = (await ShopTransactionModel.find(filterObject)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .select(projectionObject)
    .lean()) as ShopTransaction[];

  const transactionsToSend = transactions.map((transaction) => {
    let status: string;
    switch (transaction.transactionStatus) {
      case TransactionStatusEnum.COMPLETED:
        status = "COMPLETED";
        break;
      case TransactionStatusEnum.PENDING:
        status = "PENDING";
        break;
      case TransactionStatusEnum.REFUNDED:
        status = "REFUNDED";
        break;
      default:
        status = "COMPLETED";
        break;
    }

    return {
      ...transaction,
      transactionStatus: status,
    };
  });

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    transactions: transactionsToSend,
  });
};

export const getInvoiceById = async (req: IUserRequest, res: Response) => {
  const {invoiceId} = req.params;
  const {userId} = req.user!;

  const invoice = await InvoiceModel.findById(invoiceId);

  if(!invoice || invoice.userId != userId) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  res.status(StatusCodes.OK).json({invoice})
}
