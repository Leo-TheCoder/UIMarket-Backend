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

//Enum
import { TransactionActionEnum, TransactionStatusEnum } from "../types/enum";
import { Invoice } from "../types/object-type";

export const pointTransaction = async (
  userId: string,
  changeAmount: number,
  reason: string
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
        { transactionStatus: 0 }
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
  changeAmount: number
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
    { transactionStatus: 0 }
  );

  if (transaction) {
    user.customerWallet.point = balanceAmount;
    const result = await user.save();

    if (result) {
      return result;
    } else {
      const rollBack = await PointTransactionModel.findByIdAndUpdate(
        transactionId,
        { transactionStatus: 1 }
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
  status: TransactionStatusEnum,
  opt: { session: any }
) => {
  //Checking userId and shopId
  const userPromise = UserModel.findOne({
    _id: userId,
    customerStatus: 1,
  })
    .session(opt.session)
    .lean();
  const invoicePromise = InvoiceModel.findOne({ _id: invoiceId })
    .session(opt.session)
    .lean();
  const [user, invoice] = await Promise.all([userPromise, invoicePromise]);
  if (!user) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  } else if (!invoice) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  //Record the transaction
  // const transaction = await UserTransactionModel.create({
  //   userId: userId,
  //   invoiceId: invoiceId,
  //   reason: reason,
  //   changeAmount: changeAmount,
  //   transactionStatus: status,
  // });
  const transaction = await new UserTransactionModel({
    userId: userId,
    invoiceId: invoiceId,
    reason: reason,
    changeAmount: changeAmount,
    transactionStatus: status,
  }).save(opt);

  if (!transaction) {
    throw new NotFoundError(ErrorMessage.ERROR_FAILED);
  } else {
    return transaction;
  }
};

export const shopTransaction = async (
  shopId: string,
  invoiceId: string | null,
  productId: string | null,
  action: TransactionActionEnum,
  changeAmount: number,
  opt: { session: any }
) => {
  //Checking shopId
  const shop = await ShopModel.findOne({ _id: shopId, shopStatus: 1 }).session(
    opt.session
  );
  if (!shop) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_SHOP_ID);
  }

  const currentAmount = shop.shopBalance;
  const balanceAmount = currentAmount + changeAmount;

  //Checking invoice ID
  const invoice = await InvoiceModel.findById(invoiceId).session(opt.session);
  if (!invoice) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  // //Update shop wallet
  // shop.shopBalance = balanceAmount;
  // const newBalance = await shop.save();

  const transaction = await new ShopTransactionModel({
    shopId: shopId,
    invoiceId: invoiceId,
    productId: productId,
    action: action,
    currentAmount: currentAmount,
    changeAmount: changeAmount,
    balanceAmount: balanceAmount,
  }).save(opt);
  return transaction;
};

export const shopTransactionObjects = (
  invoice: Invoice,
  action: TransactionActionEnum,
  sellerFee: number,
  shopBalances: {_id: String, shopBalance: number}[],
) => {
  const shopIds = shopBalances.map(shop => shop._id);
  const banlances = shopBalances.map(shop => shop.shopBalance);

  return invoice.productList.map((product, index) => {
    let netAmount = (product.productPrice * (100 - sellerFee)) / 100;
    netAmount = Math.round(netAmount * 100) / 100;

    const searchIndex = (s: String) => {
      for(let i = 0; i < shopIds.length; i++) {
        if(s == shopIds[i]) {
          return i;
        }
      }
      return -1;
    }

    const shopIndex = searchIndex(product.shop);
    const currentAmount = banlances[shopIndex];
    const balanceAmount = currentAmount + netAmount;

    return {
      shopId: product.shop,
      invoiceId: invoice._id,
      productId: product.product,
      action: action,
      currentAmount: currentAmount,
      changeAmount: netAmount,
      balanceAmount: balanceAmount,
    }

  })
};

export const shopWithdrawTransaction = async (
  shopFullDocument: any,
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
    action: TransactionActionEnum.WITHDRAW,
    currentAmount: currentAmount,
    changeAmount: changeAmount,
    balanceAmount: balanceAmount,
    transactionStatus: TransactionStatusEnum.COMPLETED,
  });

  return transaction;
};

export const refundTransaction = async (
  userId: string,
  invoiceId: string,
  productIds: string[],
  amount: number
) => {
  const shopTransactionResult = await ShopTransactionModel.updateMany(
    {
      invoiceId,
      productId: { $in: productIds },
    },
    {
      transactionStatus: TransactionStatusEnum.REFUNDED,
    }
  );

  await UserTransactionModel.create({
    userId: userId,
    invoiceId: invoiceId,
    reason: `Refund from DeeX`,
    changeAmount: amount,
    transactionStatus: TransactionStatusEnum.REFUNDED,
  });
};
