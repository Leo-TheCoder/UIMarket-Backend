import { Response, NextFunction } from "express";
import { IUserRequest } from "../types/express";
declare const compulsoryAuth: (req: IUserRequest, res: Response, next: NextFunction) => void;
declare const optionalAuth: (req: IUserRequest, res: Response, next: NextFunction) => void;
export declare const adminAuth: (req: IUserRequest, res: Response, next: NextFunction) => void;
export { compulsoryAuth, optionalAuth };
//# sourceMappingURL=authentication.d.ts.map