import { Response } from "express";
import { IUserRequest } from "../types/express";
export declare const createOrder: (req: IUserRequest, res: Response) => Promise<void>;
export declare const cancelPayment: (req: IUserRequest, res: Response) => void;
export declare const payoutOrder: (req: IUserRequest, res: Response) => Promise<void>;
export declare const returnAfterLoginPaypal: (req: IUserRequest, res: Response) => Promise<void>;
export declare const authorizationEndpoint: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const chargeCoin: (req: IUserRequest, res: Response) => Promise<void>;
export declare const captureOrder: (req: IUserRequest, res: Response) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map