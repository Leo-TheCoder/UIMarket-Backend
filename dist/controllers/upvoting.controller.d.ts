import { Response } from "express";
import { IUserRequest } from "../types/express";
declare const upvote: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export { upvote };
//# sourceMappingURL=upvoting.controller.d.ts.map