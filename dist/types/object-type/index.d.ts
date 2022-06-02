import { TransactionStatus } from "../enum";
export declare type Product = {
    shop: string;
    product: string;
    productPrice: number;
    productName: string;
    isReview: number;
    license?: string;
};
export declare type Invoice = {
    productList: Array<Product>;
    userId: string;
    invoiceTotal: number;
    invoiceStatus: string;
    _id: string;
    save: () => Promise<any>;
};
export declare type ShopTransaction = {
    _id: string;
    reason: string;
    changeAmount: number;
    transactionStatus: TransactionStatus;
};
//# sourceMappingURL=index.d.ts.map