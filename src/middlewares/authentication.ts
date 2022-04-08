import User from "../models/User.model";
import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../errors";
import { Response, NextFunction } from "express";
import { IUserRequest } from "../types/express";

interface PayloadUser extends jwt.JwtPayload {
  userId: string;
  shopId: string;
  name: string;
  isActive: boolean;
}

const compulsoryAuth = (
  req: IUserRequest,
  res: Response,
  next: NextFunction,
) => {
  //check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadUser;
    req.user = {
      userId: payload.userId,
      shopId: payload.shopId,
      name: payload.name,
      isActive: payload.isActive,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authencation invalid");
  }
};

const optionalAuth = (req: IUserRequest, res: Response, next: NextFunction) => {
  //check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    // throw new UnauthenticatedError('Authentication invalid');
    req.user = undefined;
    return next();
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadUser;
    req.user = {
      userId: payload.userId,
      shopId: payload.shopId,
      name: payload.name,
      isActive: payload.isActive,
    };
    next();
  } catch (error) {
    // throw new UnauthenticatedError("Authencation invalid");
    req.user = undefined;
    next();
  }
};

// const shopCompulsoryAuth = (
//   req: IShopRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   //check header
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer")) {
//     throw new UnauthenticatedError("Authentication invalid");
//   }
//   const token = authHeader.split(" ")[1];

//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadShop;
//     req.shop = {
//       shopId: payload.shopId,
//       shopName: payload.shopName,
//       isActive: payload.isActive,
//     };
//     next();
//   } catch (error) {
//     throw new UnauthenticatedError("Authencation invalid");
//   }
// };

export {
  compulsoryAuth,
  optionalAuth,
  // shopCompulsoryAuth
};
