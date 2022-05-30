import { Request, Response } from "express";
import { IUserRequest } from "../../types/express";
export declare const getAllShops: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deactiveShop: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const activeShop: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=shops.controller.d.ts.map