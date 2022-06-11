import { TransactionActionEnum, TransactionStatusEnum } from "../types/enum";
import { Invoice } from "../types/object-type";
export declare const pointTransaction: (userId: string, changeAmount: number, reason: string) => Promise<any>;
export declare const pointRollBack: (userId: string, transactionId: string, changeAmount: number) => Promise<any>;
export declare const userTransaction: (userId: string, invoiceId: string, changeAmount: number, reason: string, status: TransactionStatusEnum, opt: {
    session: any;
}) => Promise<any>;
export declare const shopTransaction: (shopId: string, invoiceId: string | null, productId: string | null, action: TransactionActionEnum, changeAmount: number, opt: {
    session: any;
}) => Promise<any>;
export declare const shopTransactionObjects: (invoice: Invoice, action: TransactionActionEnum, sellerFee: number, shopBalances: {
    _id: String;
    shopBalance: number;
}[]) => {
    shopId: string;
    invoiceId: string;
    productId: string;
    action: TransactionActionEnum;
    currentAmount: number;
    changeAmount: number;
    balanceAmount: number;
}[];
export declare const shopWithdrawTransaction: (shopFullDocument: any, changeAmount: number) => Promise<any>;
export declare const refundTransaction: (userId: string, invoiceId: string, productIds: string[], amount: number) => Promise<void>;
//# sourceMappingURL=currencyTransaction.d.ts.map