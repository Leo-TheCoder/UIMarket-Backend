import { Response } from "express";
import { IUserRequest } from "../../types/express";
export declare const getAllUsers: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deactiveUser: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const activeUser: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unverifyUser: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendMailForTest: (req: IUserRequest, res: Response) => Promise<void>;
//# sourceMappingURL=users.controller.d.ts.map