import { Response } from "express";
import { IUserRequest } from "../types/express";
declare const downvote: (req: IUserRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export { downvote };
//# sourceMappingURL=downvoting.controller.d.ts.map