import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
export declare const getAllProducts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const findByCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const findById: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const findByName: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getProductsByShop: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { findByCategory, findById, findByName, getProductsByShop, };
//# sourceMappingURL=product.controller.d.ts.map