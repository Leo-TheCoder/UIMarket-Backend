import { Request, Response } from "express";
import * as Constants from "../../constants";
import { StatusCodes } from "http-status-codes";
import UserModel from "../../models/User.model";
import { IUserRequest } from "../../types/express";
import { BadRequestError, NotFoundError } from "../../errors";
import * as ErrorMessage from "../../errors/error_message";
import { sendMailTest } from "../../utils/sendMail";
import ShopModel from "../../models/Shop.model";
import LicenseModel from "../../models/License.model";
import { LicesneStatusEnum, TransactionStatusEnum } from "../../types/enum";
import ProductModel from "../../models/Product.model";
import InvoiceModel from "../../models/Invoice.model";
import ShopTransactionModel from "../../models/ShopTransaction.model";
import ReportModel from "../../models/Report.model";
import {ShopTransaction} from "../../types/object-type";

interface IQuery {
  page?: string;
  limit?: string;
  sort?: SortTypes;
  filter?: FilterTypes;
}

enum SortTypes {
  OLDEST = "oldest",
  NEWEST = "newest",
}

const sortObjMongoose = (sort?: SortTypes) => {
  switch (sort) {
    case SortTypes.OLDEST:
      return { createdAt: 1 };
    case SortTypes.NEWEST:
      return { createdAt: -1 };
    default:
      return {};
  }
};

enum FilterTypes {
  STATUS_ACTIVE = "status-active",
  STATUS_NOT_VERIFIED = "status-not-verified",
  STATUS_DEACTIVE = "status-deactive",
  SELLER = "seller",
  NON_SELLER = "non-seller",
}

const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    case FilterTypes.STATUS_ACTIVE:
      return { customerStatus: 1 };
    case FilterTypes.STATUS_NOT_VERIFIED:
      return { customerStatus: 0 };
    case FilterTypes.STATUS_DEACTIVE:
      return { customerStatus: -1 };
    case FilterTypes.SELLER:
      return { shopId: { $ne: null } };
    case FilterTypes.NON_SELLER:
      return { shopId: null };
    default:
      return {};
  }
};

const projectionUserList = {
  __v: 0,
  authenToken: 0,
  customerPassword: 0,
  customerBio: 0,
  refreshToken: 0,
  customerWallet: 0,
};

export const getAllUsers = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  const total = await UserModel.countDocuments({
    ...filterObj,
    isAdmin: false,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const users = await UserModel.find(
    {
      ...filterObj,
      isAdmin: false,
    },
    projectionUserList,
  )
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    // .populate({ path: "productCategory", select: ["categoryName"] })
    // .populate({ path: "shopId", select: ["shopName"] })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    users,
  });
};

export const deactiveUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== -1) {
    user.customerStatus = -1; //Deactive
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const activeUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== 1) {
    user.customerStatus = 1; //Active
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_ACTIVATED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const unverifyUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== 0) {
    user.customerStatus = 0; //Unverify account
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const sendMailForTest = async (req: IUserRequest, res: Response) => {
  const { email } = req.body;
  sendMailTest(email, email);
  res.status(StatusCodes.OK).json({
    msg: "Email has sent",
  });
};

export const profileDetail = async (req: IUserRequest, res: Response) => {
  const {userId} = req.params;
  
  const user = await UserModel.findById(userId, {
    customerPassword: 0,
    authenToken: 0,
    refreshToken: 0,
  });

  if(!user) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  let shop = {};
  if(user.shopId) {
    const shopDetail = await ShopModel.findById(user.shopId, {
      userId: 0,
      shopDescription: 0,
    });

    const productCount = await ProductModel.count({
      shopId: user.shopId,
      deleteFlagged: 0,
      isBanned: 0,
    });

    const orderCount = await LicenseModel.count({
      shopId: user.shopId,
    })
    
    shop = {
      shopDetail,
      productCount,
      orderCount,
    }
  }

  const productBought = await LicenseModel.count({
    userId: userId,
    licenseStatus: LicesneStatusEnum.ACTIVE,
  });

  const reportCount = await ReportModel.count({
    userId: userId,
  });
  const reportVerifiedCount = await ReportModel.count({
    userId: userId,
    reportStatus: 1,
  })

  res.status(StatusCodes.OK).json({
    user: user.toObject(),
    shop,
    productBought,
    report: {
      reportCount,
      reportVerifiedCount,
    }
  })
}

interface IShopTransactionQuery {
  page?: string;
  limit?: string;
  sort?: SortShopTransasctionTypes;
  filter?: FilterShopTransactionTypes;
}

enum FilterShopTransactionTypes {
  COMPLETED = "completed",
  PENDING = "pending",
  REFUNDED = "refunded",
}
enum SortShopTransasctionTypes {
  NEWEST = "newest",
  OLDEST = "oldest",
}
const filterShopTransactionObjMongoose = (filter?: FilterShopTransactionTypes) => {
  switch (filter) {
    case FilterShopTransactionTypes.COMPLETED:
      return { transactionStatus: TransactionStatusEnum.COMPLETED };
    case FilterShopTransactionTypes.PENDING:
      return { transactionStatus: TransactionStatusEnum.PENDING };
    case FilterShopTransactionTypes.REFUNDED:
      return { transactionStatus: TransactionStatusEnum.REFUNDED };
    default:
      return {};
  }
};
const sortShopTransactionObjMongoose = (sort?: SortShopTransasctionTypes) => {
  switch (sort) {
    case SortShopTransasctionTypes.OLDEST:
      return { createdAt: 1 };
    case SortShopTransasctionTypes.NEWEST:
      return { createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

export const getShopTransaction = async (req: IUserRequest, res: Response) => {
  const { shopId } = req.params;

  const query = req.query as IShopTransactionQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const filter = query.filter;
  const filterObj = filterShopTransactionObjMongoose(filter);
  const sort = query.sort;
  const sortObj = sortShopTransactionObjMongoose(sort);

  const filterObject = {
    shopId,
    ...filterObj,
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

const purchaseHistory = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const filterObj = {
    userId,
    licenseStatus: {$in: [LicesneStatusEnum.ACTIVE, LicesneStatusEnum.REFUNDING] }
  };

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

  const productsToResponse = licenses.map((_license) => {
    const license = _license.toObject();
    const isReview = license.invoice.productList.findIndex(
      (x: any) => String(x.product) == String(license.product._id)
    );

    const picture = license.product.productPictures[0];
    return {
      ...license,
      invoice: undefined,
      isReview: license.invoice.productList[isReview].isReview,
      invoiceId: license.invoice._id,
      isInvoiceRefunded: license.invoice.isRefunded,
      product: {
        ...license.product,
        productPictures: picture,
      },
    };
  });

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    products: productsToResponse,
  });
}