import { IUserRequest } from "../types/express";
import { Response } from "express";
declare const createComment: (req: IUserRequest, res: Response) => Promise<void>;
declare const getComments: (req: IUserRequest, res: Response) => Promise<void>;
declare const updateComment: (req: IUserRequest, res: Response) => Promise<void>;
declare const deleteComment: (req: IUserRequest, res: Response) => Promise<void>;
export { createComment, getComments, deleteComment, updateComment, };
//# sourceMappingURL=comment.controller.d.ts.map