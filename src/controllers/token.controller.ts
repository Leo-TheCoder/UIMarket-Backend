import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import UserModel from "../models/User.model";
import jwt from "jsonwebtoken";
import { IPayloadUser } from "../types/jwt-payload";

const JWT_SECRET = process.env.JWT_SECRET!;

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body;
  try {
    const opts = {
      ignoreExpiration: true,
    };
    const { userId } = jwt.verify(
      accessToken,
      JWT_SECRET,
      opts
    ) as IPayloadUser;
    const user = await UserModel.findById(userId);
    const ret = user.compareToken(refreshToken);
    if (ret) {
      const newAccessToken = user.createJWT();
      return res.json({
        accessToken: newAccessToken,
      });
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "refreshToken is revoked.",
    });
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid accessToken.",
    });
  }
};

export const revoke = async(req: IUserRequest, res: Response) => {
    const {userId} = req.user!;
    const user = await UserModel.findById(userId);

    if(!user) {
        throw new UnauthenticatedError("Invalid account");
    }

    user.refreshToken=null;
    await user.save();
    return res.status(StatusCodes.OK).json({
        message: "Revoke successfully!"
    })
}