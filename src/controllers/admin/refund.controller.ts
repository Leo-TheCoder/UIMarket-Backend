import { RefundStatusEnum } from "../../types/enum";
import { IUserRequest } from "../../types/express";
import { Response } from "express";
import * as Constants from "../../constants";
import { StatusCodes } from "http-status-codes";
import RefundModel from "../../models/Refund.model";
import { BadRequestError, InternalServerError } from "../../errors";
import * as ErrorMessage from "../../errors/error_message";
import { getSystemDocument } from "./system.controller";
import { Refund_PayPal } from "../../utils/paypal";
import { refundTransaction } from "../../utils/currencyTransaction";
import {
  updateInvoiceAndLicensesAfterDeclineRefund,
  updateInvoiceAndLicensesAfterRefund,
} from "../../utils/statusInvoice";
import LicenseModel from "../../models/License.model";

interface IRefund {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        customerName: string;
      };
  invoiceId:
    | string
    | {
        _id: string;
      };
  licenseIds:
    | string[]
    | {
        _id: string;
      }[];
  refundReason: string;
  refundEvidences: string[];
  refundStatus: RefundStatusEnum;
}

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

enum FilterTypes {
  STATUS_ALL = "all",
  STATUS_PENDING = "pending",
  STATUS_ACCEPT = "accept",
  STATUS_REJECT = "reject",
  STATUS_SOLVED = "solved",
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

const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    case FilterTypes.STATUS_PENDING:
      return { refundStatus: RefundStatusEnum.PENDING };
    case FilterTypes.STATUS_ACCEPT:
      return { refundStatus: RefundStatusEnum.RESOLVED };
    case FilterTypes.STATUS_REJECT:
      return { refundStatus: RefundStatusEnum.DECLINED };
    case FilterTypes.STATUS_SOLVED:
      return {
        refundStatus: {
          $in: [RefundStatusEnum.RESOLVED, RefundStatusEnum.DECLINED],
        },
      };
    default:
      break;
  }
};

export const getAllRefund = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  const total = await RefundModel.countDocuments({
    ...filterObj,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const refunds = await RefundModel.find({
    ...filterObj,
  })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "userId", select: "customerName" })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    refunds,
  });
};

export const getRefundById = async (req: IUserRequest, res: Response) => {
  const { refundId } = req.params;
  const refund = await RefundModel.findById(refundId)
    .populate({
      path: "licenseIds",
      select: "product shop productPrice",
      populate: {
        path: "product shop",
        select: "productName shopName",
      },
    })
    .populate({ path: "userId", select: "customerName" });

  
  
  return res.status(StatusCodes.OK).json({
    refund,
  });
};

enum RefundAction {
  ACCEPT = "ACCEPT",
  DENY = "DENY",
}
export const acceptRefund = async (req: IUserRequest, res: Response) => {
  const refundId = req.params.refundId as string;
  //const action = req.body.action as RefundAction;
  const action = RefundAction.ACCEPT;

  if (!refundId || !action) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  const refundDoc = (await RefundModel.findById(refundId)
    .populate({
      path: "licenseIds",
      select: "shop product productPrice",
      populate: {
        path: "product",
        select: "productName",
      },
    })
    .populate({ path: "invoiceId", select: "transactionPaypalId" })) as {
    _id: string;
    userId: string;
    licenseIds: [
      {
        _id: string;
        shop: string;
        product: {
          _id: string;
          productName: string;
        };
        productPrice: number;
      }
    ];
    invoiceId: {
      _id: string;
      transactionPaypalId: string;
    };
    refundReason: string;
    refundEvidences: string[];
    refundStatus: RefundStatusEnum;
    refundAmount: number;
    save: (option?: any) => Promise<any>;
  };

  if (!refundDoc) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_REQUEST_REFUND);
  }

  const transactionPaypalId = refundDoc.invoiceId.transactionPaypalId;
  const licenseIds = refundDoc.licenseIds.map((license) => license._id);
  const productIds = refundDoc.licenseIds.map((license) => license.product._id);

  let refundAmount = refundDoc.refundAmount;
  // let refundAmount = 0;
  // refundDoc.licenseIds.forEach((license) => {
  //   refundAmount += license.productPrice;
  //   console.log(license._id, license.productPrice);
  // });
  
  if(refundAmount === 0) {
    throw new BadRequestError(ErrorMessage.ERROR_FREE_REFUND);
  }

  // const buyerFee = (await getSystemDocument()).buyerFee;
  // refundAmount = (refundAmount * (100 + buyerFee)) / 100;
  // refundAmount = Math.round(refundAmount * 100) / 100;

  const response = await Refund_PayPal(
    transactionPaypalId,
    refundAmount,
    refundDoc.invoiceId._id,
    `Refund accepted from invoice: ${refundDoc.invoiceId._id}`
  );

  //Refund failed
  if (response?.data.status != "COMPLETED") {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }

  const refundSession = await LicenseModel.startSession();
  const opt = { session: refundSession };

  await refundSession.withTransaction(async () => {
    await refundTransaction(
      refundDoc.userId,
      refundDoc.invoiceId._id,
      productIds,
      refundAmount,
      opt
    );

    await updateInvoiceAndLicensesAfterRefund(
      licenseIds,
      refundDoc.invoiceId._id,
      opt
    );

    refundDoc.refundStatus = RefundStatusEnum.RESOLVED;
    await refundDoc.save(opt);
  });

  res.status(StatusCodes.OK).json({
    refund: refundDoc,
    msg: "Refund successfully!",
  });
};

export const rejectRefund = async (req: IUserRequest, res: Response) => {
  const refundId = req.params.refundId as string;
  //const action = req.body.action as RefundAction;
  const action = RefundAction.DENY;

  if (!refundId || !action) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  const refundDoc = (await RefundModel.findById(refundId)
    .populate({
      path: "licenseIds",
      select: "shop product productPrice",
      populate: {
        path: "product",
        select: "productName",
      },
    })
    .populate({ path: "invoiceId", select: "transactionPaypalId" })) as {
    _id: string;
    userId: string;
    licenseIds: [
      {
        _id: string;
        shop: string;
        product: {
          _id: string;
          productName: string;
        };
        productPrice: number;
      }
    ];
    invoiceId: {
      _id: string;
      transactionPaypalId: string;
    };
    refundReason: string;
    refundEvidences: string[];
    refundStatus: RefundStatusEnum;
    save: (option?: any) => Promise<any>;
  };

  if (!refundDoc) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_REQUEST_REFUND);
  }

  const licenseIds = refundDoc.licenseIds.map((license) => license._id);

  const refundSession = await LicenseModel.startSession();
  const opt = { session: refundSession };

  await refundSession.withTransaction(async () => {
    await updateInvoiceAndLicensesAfterDeclineRefund(
      licenseIds,
      refundDoc.invoiceId._id,
      opt
    );

    refundDoc.refundStatus = RefundStatusEnum.DECLINED;
    await refundDoc.save(opt);
  });

  return res.status(StatusCodes.OK).json({
    refund: refundDoc,
    msg: "Refund Rejected",
  });
};
