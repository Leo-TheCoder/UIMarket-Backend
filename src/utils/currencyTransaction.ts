//Library
import { BadRequestError, InternalServerError, NotFoundError } from "../errors";

//Model
import PointTransactionModel from "../models/PointTransaction.model";
import UserModel from "../models/User.model";
import ShopModel from "../models/Shop.model";
import UserTransactionModel from "../models/UserTransaction.model";
import ShopTransactionModel from "../models/ShopTransaction.model";
import InvoiceModel from "../models/Invoice.model";

//Error
import * as ErrorMessage from "../errors/error_message";

export const pointTransaction = async (
  userId: string,
  changeAmount: number,
  reason: string,
) => {
  //Checking userId
  const user = await UserModel.findOne({ _id: userId, customerStatus: 1 });
  if (!user) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  //Checking amount
  const currentAmount = user.customerWallet.point;
  const balanceAmount = currentAmount + changeAmount;
  if (balanceAmount < 0) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
  }

  //Record the transaction
  const transaction = await PointTransactionModel.create({
    toAccount: userId,
    reason: reason,
    currentAmount: currentAmount,
    changeAmount: changeAmount,
    balanceAmount: balanceAmount,
  });

  if (!transaction) {
    throw new NotFoundError(ErrorMessage.ERROR_FAILED);
  } else {
    user.customerWallet.point = balanceAmount;
    const result = await user.save();

    if (!result) {
      const rollBack = await PointTransactionModel.findByIdAndUpdate(
        transaction._id,
        { transactionStatus: 0 },
      );
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    } else {
      return transaction;
    }
  }
};

export const pointRollBack = async (
  userId: string,
  transactionId: string,
  changeAmount: number,
) => {
  //Checking userId
  const user = await UserModel.findOne({ _id: userId, customerStatus: 1 });
  if (!user) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  //Delete transaction and roll back point
  const currentAmount = user.customerWallet.point;
  const balanceAmount = currentAmount - changeAmount;

  const transaction = await PointTransactionModel.findByIdAndUpdate(
    transactionId,
    { transactionStatus: 0 },
  );

  if (transaction) {
    user.customerWallet.point = balanceAmount;
    const result = await user.save();

    if (result) {
      return result;
    } else {
      const rollBack = await PointTransactionModel.findByIdAndUpdate(
        transactionId,
        { transactionStatus: 1 },
      );
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    }
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const userTransaction = async (
  userId: string,
  invoiceId: string,
  changeAmount: number,
  reason: string,
) => {
  //Checking userId and shopId
  const userPromise = UserModel.findOne({ _id: userId, customerStatus: 1 }).lean();
  const invoicePromise = InvoiceModel.findOne({ _id: invoiceId }).lean();
  const [user, invoice] = await Promise.all([userPromise, invoicePromise]);
  if (!user) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  } else if (!invoice) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Record the transaction
  const transaction = await UserTransactionModel.create({
    userId: userId,
    invoiceId: invoiceId,
    reason: reason,
    changeAmount: changeAmount,
  });

  if (!transaction) {
    throw new NotFoundError(ErrorMessage.ERROR_FAILED);
  } else {
    return transaction;
  }
};

export const shopTransaction = async (
  shopId: string,
  invoiceId: string | null,
  reason: string,
  changeAmount: number,
) => {
  //Checking shopId
  const shop = await ShopModel.findOne({ _id: shopId, shopStatus: 1 });
  if (!shop) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
  }

  const currentAmount = shop.shopBalance;
  const balanceAmount = currentAmount + changeAmount;

 //Checking invoice ID
 const invoice = await InvoiceModel.findById(invoiceId);
 if (!invoice) {
   throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
 }

 //Update shop wallet
 shop.shopBalance = balanceAmount;
 const newBalance = await shop.save();
 if (!newBalance) {
   throw new InternalServerError(ErrorMessage.ERROR_FAILED);
 } else {
   const transaction = await ShopTransactionModel.create({
     shopId: shopId,
     invoiceId: invoiceId,
     reason: reason,
     currentAmount: currentAmount,
     changeAmount: changeAmount,
     balanceAmount: balanceAmount,
   });
   return transaction;
 }
};

export const shopWithdrawTransaction = async(
  shopFullDocument: any,
  reason: string,
  changeAmount: number
) => {
  const shop = shopFullDocument;

  const currentAmount = shop.shopBalance;
  const balanceAmount = currentAmount + changeAmount;

  if (balanceAmount < 0) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
  } 
   //Update shop wallet
   shop.shopBalance = balanceAmount;
   const newBalance = await shop.save();

   if (!newBalance) {
     throw new InternalServerError(ErrorMessage.ERROR_FAILED);
   } 

   const transaction = await ShopTransactionModel.create({
     shopId: shop._id,
     reason: reason,
     currentAmount: currentAmount,
     changeAmount: changeAmount,
     balanceAmount: balanceAmount,
   });

   return transaction;
}