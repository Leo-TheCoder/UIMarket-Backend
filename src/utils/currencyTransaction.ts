import { BadRequestError, NotFoundError } from "../errors";
import PointTransactionModel from "../models/PointTransaction.model";
import UserModel from "../models/User.model";

const pointTransaction = async (userId: string, changeAmount: number) => {
  //Checking userId
  const user = await UserModel.findOne({ _id: userId, customerStatus: 1 });
  if (!user) {
    throw new NotFoundError("Not found user ID");
  }

  //Checking amount
  const currentAmount = user.customerWallet.point;
  const balanceAmount = currentAmount + changeAmount;
  if (balanceAmount < 0) {
    throw new BadRequestError("Invalid amount");
  }

  //Record the transaction
  const transaction = await PointTransactionModel.create({
    toAccount: userId,
    currentAmount: currentAmount,
    changeAmount: changeAmount,
    balanceAmount: balanceAmount,
  });

  if (!transaction) {
    throw new NotFoundError("Something went wrong");
  } else {
    user.customerWallet.point = balanceAmount;
    const result = await user.save();

    if (!result) {
      const rollBack = await PointTransactionModel.findByIdAndUpdate(
        transaction._id,
        { transactionStatus: 0 },
      );
      throw new NotFoundError("Something went wrong");
    } else {
      return transaction;
    }
  }
};

const pointRollBack = async (
  userId: string,
  transactionId: string,
  changeAmount: number,
) => {
  //Checking userId
  const user = await UserModel.findOne({ _id: userId, customerStatus: 1 });
  if (!user) {
    throw new NotFoundError("Not found user ID");
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
      throw new NotFoundError("Something went wrong");
    }
  } else {
    throw new NotFoundError("Something went wrong");
  }
};

export { pointTransaction, pointRollBack };
