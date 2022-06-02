import ShopTransactionModel from '../models/ShopTransaction.model';
import { TransactionStatusEnum } from '../types/enum';
import { getSystemDocument } from "../controllers/admin/system.controller";

export const resolveShopPayment = async () => {
  console.log("Resolving shop payment ...");

  const _system = await getSystemDocument();
  const periodToConfirmPayment = _system.periodToConfirmPayment;

  const now = new Date();
  const daysAgo = new Date();
  daysAgo.setDate(now.getDate() - periodToConfirmPayment);

  ShopTransactionModel.updateMany(
      {
        transactionStatus: TransactionStatusEnum.PENDING,
        updatedAt: {$lt: daysAgo}
      },
      {
          transactionStatus: TransactionStatusEnum.COMPLETED,
      },
  ).then(result => {
    console.log(`Number of transaction confirm: ${result.modifiedCount}`);
  }).catch(error => {
      console.error(error);
  })
};
