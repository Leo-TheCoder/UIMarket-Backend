import { Request } from "express";

interface IUserRequest extends Request {
  user?: {
    userId: string;
    name: string;
    isActive: boolean;
  };
}

interface IShopRequest extends Request {
  shop?: {
    shopId: string;
    shopName: string;
    isActive: boolean;
  };
}

export { IUserRequest, IShopRequest };
