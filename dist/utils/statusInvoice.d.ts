import { Invoice } from "../types/object-type";
import { ClientSession } from "mongoose/node_modules/mongodb";
export declare const updateInvoiceAndLicensesBeforeRefund: (licenseIds: string[], invoiceId: string) => void;
export declare const updateInvoiceAndLicensesAfterRefund: (licenseIds: string[], invoiceId: string) => void;
export declare const updateInvoiceAndLicensesAfterDeclineRefund: (licenseIds: string[], invoiceId: string) => void;
export declare const updateInvoiceAndLicensesAfterPayment_Transaction: (invoice: Invoice, sellerFee: number, buyerFee: number, userId: string, session: ClientSession) => Promise<void>;
//# sourceMappingURL=statusInvoice.d.ts.map