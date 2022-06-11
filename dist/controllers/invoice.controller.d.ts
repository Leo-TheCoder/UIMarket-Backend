import { Response } from "express";
import { IUserRequest } from "../types/express";
declare type Product = {
    product: string;
    shop: string;
    shopName: string;
    productName: string;
    productPrice: number;
};
export declare const preOrder: (productList: any[]) => Promise<{
    productList: ({
        product: any;
        productName: any;
        shop: any;
        shopName: any;
        productPrice: any;
    } | undefined)[];
    invoiceTotal: number;
}>;
export declare const createOrder: (userId: string, _productList: Product[], buyerFee: number) => Promise<any>;
export declare const paidInvoice: (invoice: any, transactionId: any, userId: string, opt: {
    session: any;
}) => Promise<any>;
export declare const purchaseHistory: (req: IUserRequest, res: Response) => Promise<void>;
export declare const searchPurchaseHistory: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getShopTransaction: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInvoiceById: (req: IUserRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=invoice.controller.d.ts.map