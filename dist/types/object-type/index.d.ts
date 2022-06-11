import { TransactionStatusEnum, TransactionActionEnum } from "../enum";
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
    transactionPaypalId?: string;
    transactionId?: string;
    invoiceStatus: string;
    _id: string;
    save: (option?: any) => Promise<any>;
};
export declare type ShopTransaction = {
    _id: string;
    productId: string;
    action: TransactionActionEnum;
    changeAmount: number;
    transactionStatus: TransactionStatusEnum;
    updatedAt?: Date;
    createdAt?: Date;
};
//# sourceMappingURL=index.d.ts.map