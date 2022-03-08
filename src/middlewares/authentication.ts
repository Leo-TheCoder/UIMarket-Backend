import User from "../models/User";
import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../errors";
import { Request, Response, NextFunction } from "express";

interface PayloadUser extends jwt.JwtPayload {
  userId: string;
  name: string;
  isActive: boolean;
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
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
      name: payload.name,
      isActive: payload.isActive,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authencation invalid");
  }
};

export default auth;
