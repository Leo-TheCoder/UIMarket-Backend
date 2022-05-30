import { Response } from "express";
import { IUserRequest } from "../types/express";
declare type Product = {
    product: string;
    shop: string;
    shopName: string;
    productName: string;
    productPrice: number;
};
export declare const preOrder: (req: IUserRequest) => Promise<{
    productList: Product[];
    invoiceTotal: number;
}>;
export declare const createOrder: (req: IUserRequest) => Promise<any>;
export declare const paidInvoice: (invoice: any, transactionId: any, userId: string) => Promise<any>;
export declare const purchaseHistory: (req: IUserRequest, res: Response) => Promise<void>;
export declare const searchPurchaseHistory: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getShopTransaction: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=invoice.controller.d.ts.map