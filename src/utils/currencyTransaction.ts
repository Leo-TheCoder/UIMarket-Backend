//Library
import { BadRequestError, InternalServerError, NotFoundError } from "../errors";

//Model
import PointTransactionModel from "../models/PointTransaction.model";
import CoinTransactionModel from "../models/CoinTransaction.model";
import UserModel from "../models/User.model";

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

export const coinTransaction = async (
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
  const currentAmount = user.customerWallet.coin;
  const balanceAmount = currentAmount + changeAmount;
  if (balanceAmount < 0) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_AMOUNT);
  }

  //Record the transaction
  const transaction = await CoinTransactionModel.create({
    toAccount: userId,
    reason: reason,
    currentAmount: currentAmount,
    changeAmount: changeAmount,
    balanceAmount: balanceAmount,
  });

  if (!transaction) {
    throw new NotFoundError(ErrorMessage.ERROR_FAILED);
  } else {
    user.customerWallet.coin = balanceAmount;
    const result = await user.save();

    if (!result) {
      const rollBack = await CoinTransactionModel.findByIdAndUpdate(
        transaction._id,
        { transactionStatus: 0 },
      );
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    } else {
      return transaction;
    }
  }
};

export const coinRollBack = async (
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
  const currentAmount = user.customerWallet.coin;
  const balanceAmount = currentAmount - changeAmount;

  const transaction = await CoinTransactionModel.findByIdAndUpdate(
    transactionId,
    { transactionStatus: 0 },
  );

  if (transaction) {
    user.customerWallet.coin = balanceAmount;
    const result = await user.save();

    if (result) {
      return result;
    } else {
      const rollBack = await CoinTransactionModel.findByIdAndUpdate(
        transactionId,
        { transactionStatus: 1 },
      );
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    }
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};
