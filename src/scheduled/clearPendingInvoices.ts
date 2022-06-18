import { invoicePendingPeriod } from "../constants";
import InvoiceModel from "../models/Invoice.model";

export const clearInvoiceModel = async () => {
  console.log("Clear invoice model is running");
  const now = new Date();
  const daysAgo = new Date();
  daysAgo.setDate(now.getDate() - invoicePendingPeriod);

  await InvoiceModel.deleteMany({
    invoiceStatus: "Waiting",
    updatedAt: { $lt: daysAgo },
  });
};

clearInvoiceModel();
