import { Response } from "express";
import { IUserRequest } from "../types/express";
declare const createAnswer: (req: IUserRequest, res: Response) => Promise<void>;
declare const getAnswer: (req: IUserRequest, res: Response) => Promise<void>;
declare const deleteAnswer: (req: IUserRequest, res: Response) => Promise<void>;
declare const updateAnswer: (req: IUserRequest, res: Response) => Promise<void>;
export { createAnswer, getAnswer, deleteAnswer, updateAnswer, };
//# sourceMappingURL=answer.controller.d.ts.map