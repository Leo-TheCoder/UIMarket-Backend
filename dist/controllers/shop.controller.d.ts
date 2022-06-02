import { Response } from "express";
import { IUserRequest } from "../types/express";
export declare const createShop: (req: IUserRequest, res: Response) => Promise<void>;
export declare const uploadProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const deleteProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const updateProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getAllProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const updateShop: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getShopById: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getShopByName: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deactiveProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const activeProduct: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getProductStatistic: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const paymentHistory: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProductsByName: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProductStatisticV2: (req: IUserRequest, res: Response) => Promise<void>;
//# sourceMappingURL=shop.controller.d.ts.map