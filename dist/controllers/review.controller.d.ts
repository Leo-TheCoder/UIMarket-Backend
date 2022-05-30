import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
export declare const createReview: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getProductReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateReview: (req: IUserRequest, res: Response) => Promise<void>;
export declare const getReviewById: (req: Request, res: Response) => Promise<void>;
export declare const getUserReview: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=review.controller.d.ts.map