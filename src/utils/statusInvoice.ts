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

export const updateInvoiceAndLicensesAfterRefund = async (
  licenseIds: string[],
  invoiceId: string,
  opt: {session: any},
) => {
  //license status update
  await LicenseModel.updateMany(
    {
      _id: { $in: licenseIds },
    },
    {
      licenseStatus: LicesneStatusEnum.DEACTIVE,
    },
    {
      session: opt.session
    }
  );

  //invoice refund status update
  await InvoiceModel.updateOne(
    {
      _id: invoiceId,
    },
    {
      isRefunded: true,
    },
    {
      session: opt.session,
    }
  )
};

export const updateInvoiceAndLicensesAfterDeclineRefund = async (
  licenseIds: string[],
  invoiceId: string,
  opt: { session: any }
) => {
  await LicenseModel.updateMany(
    {
      _id: { $in: licenseIds },
    },
    {
      licenseStatus: LicesneStatusEnum.ACTIVE,
    },
    {
      session: opt.session,
    }
  );

  await InvoiceModel.updateOne(
    {
      _id: invoiceId,
    },
    {
      isRefunded: false,
    },
    {
      session: opt.session,
    }
  );
};
