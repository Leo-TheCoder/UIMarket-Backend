import { UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
declare const register: (req: Request, res: Response) => Promise<void>;
declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const loginWithToken: (req: IUserRequest, res: Response) => Promise<UnauthenticatedError | undefined>;
declare const verifyEmailCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const resendVerifyEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const forgetPasswordEmail: (req: Request, res: Response) => Promise<void>;
declare const resetForgetPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const resetPassword: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export { register, login, loginWithToken, verifyEmailCode, resendVerifyEmail, forgetPasswordEmail, resetForgetPassword, resetPassword, };
export declare const googleLogin: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map