import { Request } from "express";

interface IUserRequest extends Request {
  user?: {
    userId: string;
    shopId: string;
    name: string;
    isActive: boolean;
  };
}

export { IUserRequest };
