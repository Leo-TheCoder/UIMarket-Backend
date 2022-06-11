import { IUserRequest } from "../types/express";
import { Response } from "express";
declare const getProfileActivity: (req: IUserRequest, res: Response) => Promise<void>;
declare const getProfileInfo: (req: IUserRequest, res: Response) => Promise<void>;
declare const updateProfile: (req: IUserRequest, res: Response) => Promise<void>;
export { getProfileActivity, updateProfile, getProfileInfo };
export declare const getPortfolio: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePortfolio: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=profile.controller.d.ts.map