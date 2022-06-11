import { Response } from "express";
import { IUserRequest } from "../types/express";
export declare const getBuyerFee: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSellerFee: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const preOrder: (req: IUserRequest, res: Response) => Promise<void>;
export declare const createOrder: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelPayment: (req: IUserRequest, res: Response) => void;
export declare const withdrawPayment: (req: IUserRequest, res: Response) => Promise<void>;
export declare const returnAfterLoginPaypal: (req: IUserRequest, res: Response) => Promise<void>;
export declare const authorizationEndpoint: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const chargeCoin: (req: IUserRequest, res: Response) => Promise<void>;
export declare const captureOrder: (req: IUserRequest, res: Response) => Promise<void>;
export declare const paymentHistory: (req: IUserRequest, res: Response) => Promise<void>;
export declare const createRequestRefund: (req: IUserRequest, res: Response) => Promise<void>;
export declare const refund: (req: IUserRequest, res: Response) => Promise<void>;
export declare const testPaypal: (req: IUserRequest, res: Response) => Promise<void>;
export declare const testCapturePaypal: (req: IUserRequest, res: Response) => Promise<void>;
export declare const refundPayment: (req: IUserRequest, res: Response) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map