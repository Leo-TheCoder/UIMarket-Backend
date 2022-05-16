//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import LicenseModel from "../models/License.model";
import InvoiceModel from "../models/Invoice.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import { BadRequestError, InternalServerError, NotFoundError } from "../errors";

export const createLicense = async (req: Request, res: Response) => {
  //Checking body
  if (!req.body.invoice || !req.body.product || !req.body.licenseFile) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }
  //Checking this invoice is valid or not
  const invoice = await InvoiceModel.findOne({
    _id: req.body.invoice,
    invoiceStatus: "Paid",
  }).lean();
  if (!invoice) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Checking valid product
  const product = invoice.productList.find(
    (x: any) => String(x.product) == String(req.body.product),
  );
  if (!product) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
  }

  //Checking license existed or not
  const license = await LicenseModel.findOne({
    ...req.body,
  });
  if (license) {
    throw new BadRequestError(ErrorMessage.ERROR_LICENSE_EXISTED);
  }

  //Create license
  const result = await LicenseModel.create({
    ...req.body,
    userId: invoice.userId,
    boughtTime: invoice.createdAt,
    shop: product.shop,
  });

  if (result) {
    res.status(StatusCodes.CREATED).json({ result });
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};
