import LicenseModel from "../models/License.model";
import InvoiceModel from "../models/Invoice.model";
import {
  LicesneStatusEnum,
  TransactionActionEnum,
  TransactionStatusEnum,
} from "../types/enum";
import { InternalServerError } from "../errors";
import * as ErrorMessage from "../errors/error_message";
import { Invoice } from "../types/object-type";
import {
  shopTransaction,
  shopTransactionObjects,
  userTransaction,
} from "./currencyTransaction";
import { paidInvoice } from "../controllers/invoice.controller";
import ShopModel from "../models/Shop.model";
import ShopTransactionModel from "../models/ShopTransaction.model";
import { ClientSession } from "mongoose/node_modules/mongodb";

export const updateInvoiceAndLicensesBeforeRefund = (
  licenseIds: string[],
  invoiceId: string
) => {
  LicenseModel.updateMany(
    {
      _id: { $in: licenseIds },
    },
    {
      licenseStatus: LicesneStatusEnum.REFUNDING,
    }
  ).catch((error) => {
    console.error("Update licenses status to refunding: FAILED!");
  });
  InvoiceModel.updateOne(
    {
      _id: invoiceId,
    },
    {
      isRefunded: true,
    }
  ).catch((error) => {
    console.error("Update refunding invoice status: FAILED!");
  });
};

export const updateInvoiceAndLicensesAfterRefund = (
  licenseIds: string[],
  invoiceId: string
) => {
  //license status update
  LicenseModel.updateMany(
    {
      _id: { $in: licenseIds },
    },
    {
      licenseStatus: LicesneStatusEnum.DEACTIVE,
    }
  ).catch((error) => {
    console.error("Update refund licenses: FAILED!");
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  });

  //invoice refund status update
  InvoiceModel.updateOne(
    {
      _id: invoiceId,
    },
    {
      isRefunded: true,
    }
  ).catch((error) => {
    console.error("Update refund invoice status: FAILED!");
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  });
};

export const updateInvoiceAndLicensesAfterDeclineRefund = (
  licenseIds: string[],
  invoiceId: string
) => {
  LicenseModel.updateMany(
    {
      _id: { $in: licenseIds },
    },
    {
      licenseStatus: LicesneStatusEnum.ACTIVE,
    }
  ).catch((error) => {
    console.error("Update non-refund licenses: FAILED!");
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  });

  InvoiceModel.updateOne(
    {
      _id: invoiceId,
    },
    {
      isRefunded: false,
    }
  ).catch((error) => {
    console.error("Update non-refund invoice status: FAILED!");
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  });
};

// export const updateInvoiceAndLicensesAfterPayment = async (
//   invoice: Invoice,
//   sellerFee: number,
//   buyerFee: number,
//   userId: string,
//   transactionPaypalId: string
// ) => {
//   if (invoice.invoiceTotal > 0) {
//     const fee = (invoice.invoiceTotal * buyerFee) / 100;
//     const totalAmount = invoice.invoiceTotal + fee;
//     //Record user coin
//     const transaction = await userTransaction(
//       userId,
//       invoice._id,
//       -totalAmount, //minus number
//       `Pay for invoice: #${invoice._id}`,
//       TransactionStatusEnum.COMPLETED
//     );
//     //Update invoice status
//     await paidInvoice(invoice, transaction._id, userId, transactionPaypalId);
//   } else {
//     await paidInvoice(invoice, undefined, userId, transactionPaypalId);
//   }

//   const updateInvoiceLicensePromises = invoice.productList.map(
//     (product, index) => {
//       if (invoice.invoiceTotal > 0) {
//         let netAmount = (product.productPrice * (100 - sellerFee)) / 100;
//         netAmount = Math.round(netAmount * 100) / 100;
//         shopTransaction(
//           product.shop,
//           invoice._id,
//           product.product,
//           TransactionActionEnum.RECEIVE,
//           netAmount
//         ).catch((err) => {
//           console.log(err);
//         });
//       }
//       //Create license for user
//       const license = new LicenseModel({
//         userId,
//         invoice: invoice._id,
//         shop: product.shop,
//         product: product.product,
//         boughtTime: new Date(),
//         licenseFile: "a",
//         productPrice: product.productPrice,
//       });

//       return license
//         .save()
//         .then((savedLicense: any) => {
//           invoice.productList[index].license = savedLicense._id;
//         })
//         .catch((error: any) => {
//           console.error(error);
//         });
//     }
//   );

//   await Promise.all(updateInvoiceLicensePromises);
//   invoice.save().catch((error: any) => {
//     console.error(error);
//   });
// };

export const updateInvoiceAndLicensesAfterPayment_Transaction = async (
  invoice: Invoice,
  sellerFee: number,
  buyerFee: number,
  userId: string,
  session: ClientSession
) => {
  session.startTransaction();

  const opt = { session };

  if (invoice.invoiceTotal > 0) {
    const fee = (invoice.invoiceTotal * buyerFee) / 100;
    const totalAmount = invoice.invoiceTotal + fee;

    //Record user coin
    const transaction = await userTransaction(
      userId,
      invoice._id,
      -totalAmount, //minus number
      `Pay for invoice: #${invoice._id}`,
      TransactionStatusEnum.COMPLETED,
      opt
    );
    //Update invoice status
    await paidInvoice(invoice, transaction._id, userId, opt);
  } else {
    await paidInvoice(invoice, undefined, userId, opt);
  }

  if (invoice.invoiceTotal > 0) {
    const shops = (
      await ShopModel.find({
        _id: { $in: invoice.productList.map((product) => product.shop) },
        shopStatus: 1,
      })
        .session(opt.session)
        .lean()
    ).map((shop: any) => {
      return {
        _id: shop._id.toString(),
        shopBalance: shop.shopBalance,
      };
    });

    const transactionObjects = shopTransactionObjects(
      invoice,
      TransactionActionEnum.RECEIVE,
      sellerFee,
      shops
    );
    await ShopTransactionModel.insertMany(transactionObjects, {
      session: opt.session,
    });
  }

  const licenseObjects = invoice.productList.map((product) => {
    return {
      userId,
      invoice: invoice._id,
      shop: product.shop,
      product: product.product,
      boughtTime: new Date(),
      licenseFile: "a",
      productPrice: product.productPrice,
    };
  });

  const licenses = await LicenseModel.create(licenseObjects, {
    session: opt.session,
  });
  licenses.forEach((license) => {
    const id = license._id;
    const productId = license.product.toString();

    for (let i = 0; i < invoice.productList.length; i++) {
      const product = invoice.productList[i];
      if (product.product == productId) {
        product.license = id;
        break;
      }
    }
  });

  await invoice.save(opt);
};
