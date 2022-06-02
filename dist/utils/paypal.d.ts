import { Invoice, Product } from "../types/object-type";
export declare const CreateOrder_PayPal: (productList: Product[], invoice: Invoice, buyerFee: number) => Promise<any>;
export declare const Payout_PayPal: (amountValue: number | string, receiver: string) => Promise<import("axios").AxiosResponse<any, any> | undefined>;
export declare const Capture_PayPal: (token: string) => Promise<import("axios").AxiosResponse<any, any> | undefined>;
//# sourceMappingURL=paypal.d.ts.map