import { Request, Response } from "express";
import { IUserRequest } from "../types/express";

import ShopTransactionModel from "../models/ShopTransaction.model";
import UserTransactionModel from "../models/UserTransaction.model";
import ShopModel from "../models/Shop.model";
import InvoiceModel from "../models/Invoice.model";
import LicenseModel from "../models/License.model";
import ReviewModel from "../models/Review.model";

export const resetTransaction = async (req: IUserRequest, res: Response) => {
  await ShopTransactionModel.deleteMany();
  await UserTransactionModel.deleteMany();
  await InvoiceModel.deleteMany();
  await LicenseModel.deleteMany();
  await ReviewModel.deleteMany();

  await ShopModel.updateMany({
      shopBalance: {$gt: 0},
  }, {
      shopBalance: 0,
  });

  res.json({msg: "Okela"});
};
