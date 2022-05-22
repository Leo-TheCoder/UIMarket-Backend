import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthenticatedError } from "../errors";
import { Response, NextFunction } from "express";
import { IUserRequest } from "../types/express";
import { IPayloadUser } from "../types/jwt-payload";
import * as ErrorMessage from "../errors/error_message";

const compulsoryAuth = (
  req: IUserRequest,
  res: Response,
  next: NextFunction,
) => {
  //check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as IPayloadUser;
    req.user = {
      userId: payload.userId,
      shopId: payload.shopId,
      name: payload.name,
      isActive: payload.isActive,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_EXPIRED);
  }
};

const optionalAuth = (req: IUserRequest, res: Response, next: NextFunction) => {
  //check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    req.user = undefined;
    return next();
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as IPayloadUser;
    req.user = {
      userId: payload.userId,
      shopId: payload.shopId,
      name: payload.name,
      isActive: payload.isActive,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
};

export const adminAuth = (req: IUserRequest, res: Response, next: NextFunction) => {
  if(req.user?.isAdmin) {
    next();
  }
  else {
    throw new ForbiddenError(ErrorMessage.ERROR_AUTHENTICATION_INVALID)
  }
}

export { compulsoryAuth, optionalAuth };
