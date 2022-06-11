import { invoicePendingPeriod } from "../constants";
import InvoiceModel from "../models/Invoice.model";

export const clearInvoiceModel = async () => {
  const now = new Date();
  const daysAgo = new Date();
  daysAgo.setDate(now.getDate() - invoicePendingPeriod);

  await InvoiceModel.deleteMany({
    invoiceStatus: "Waiting",
    updatedAt: {$lt: daysAgo}
  })
};

clearInvoiceModel();
