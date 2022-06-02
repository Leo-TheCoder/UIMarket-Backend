import LicenseModel from "../models/License.model";
import InvoiceModel from "../models/Invoice.model";
import { LicesneStatusEnum } from "../types/enum";
import { InternalServerError } from "../errors";
import * as ErrorMessage from "../errors/error_message";

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
      isRefunded: false,
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
