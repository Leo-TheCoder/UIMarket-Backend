import LicenseModel from "../models/License.model";
import InvoiceModel from "../models/Invoice.model";
import { LicesneStatusEnum, TransactionActionEnum } from "../types/enum";
import { InternalServerError } from "../errors";
import * as ErrorMessage from "../errors/error_message";
import { Invoice } from "../types/object-type";
import { shopTransaction } from "./currencyTransaction";

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


export const updateInvoiceAndLicensesAfterPayment = async (
  invoice: Invoice,
  sellerFee: number,
  userId: string,
) => {
  const updateInvoiceLicensePromises = invoice.productList.map(
    (product, index) => {
      if(invoice.invoiceTotal > 0) {

        let netAmount = (product.productPrice * (100 - sellerFee)) / 100;
        netAmount = Math.round(netAmount * 100) / 100;
        shopTransaction(
          product.shop,
          invoice._id,
          product.product,
          TransactionActionEnum.RECEIVE,
          netAmount
        ).catch((err) => {
          console.log(err);
        });
      } 
      //Create license for user
      const license = new LicenseModel({
        userId,
        invoice: invoice._id,
        shop: product.shop,
        product: product.product,
        boughtTime: new Date(),
        licenseFile: "a",
        productPrice: product.productPrice,
      });

      return license
        .save()
        .then((savedLicense: any) => {
          invoice.productList[index].license = savedLicense._id;
        })
        .catch((error: any) => {
          console.error(error);
        });
    }
  );

  await Promise.all(updateInvoiceLicensePromises);
  invoice.save().catch((error: any) => {
    console.error(error);
  });
}