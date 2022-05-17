import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
export declare const refreshAccessToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const revoke: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=token.controller.d.ts.map