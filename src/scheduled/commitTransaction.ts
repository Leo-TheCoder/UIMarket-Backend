import ShopTransactionModel from '../models/ShopTransaction.model';
import { TransactionStatusEnum } from '../types/enum';
import { getSystemDocument } from "../controllers/admin/system.controller";
import ShopModel from '../models/Shop.model';

export const resolveShopPayment = async () => {
  console.log("Resolving shop payment ...");

  const _system = await getSystemDocument();
  const periodToConfirmPayment = _system.periodToConfirmPayment;

  const now = new Date();
  const daysAgo = new Date();
  daysAgo.setDate(now.getDate() - periodToConfirmPayment);

  const transactions = await ShopTransactionModel.find({
    transactionStatus: TransactionStatusEnum.PENDING,
    updatedAt: {$lt: daysAgo}
  })

  const updateShopBalancePromises = transactions.map(transaction => {
    return ShopModel.findById(transaction.shopId).then(shop => {
      const currentAmount = shop.shopBalance;
      const balanceAmount = currentAmount + transaction.changeAmount;
      shop.shopBalance = balanceAmount;
      shop.save();

      transaction.transactionStatus = TransactionStatusEnum.COMPLETED;
      transaction.save();
    })
  });

  await Promise.all(updateShopBalancePromises);
};

