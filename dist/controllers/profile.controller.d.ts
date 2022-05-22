import { IUserRequest } from "../types/express";
import { Response } from "express";
declare const getProfileActivity: (req: IUserRequest, res: Response) => Promise<void>;
declare const getProfileInfo: (req: IUserRequest, res: Response) => Promise<void>;
declare const updateProfile: (req: IUserRequest, res: Response) => Promise<void>;
export { getProfileActivity, updateProfile, getProfileInfo };
//# sourceMappingURL=profile.controller.d.ts.map