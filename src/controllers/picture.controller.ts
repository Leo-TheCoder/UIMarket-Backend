import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { BadRequestError, UnauthenticatedError } from "../errors";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";
import { uploadFile, getFileStream, deleteFile } from "../utils/s3";
import UserModel from "../models/User.model";
import fs from "fs";
import ultil from "util";

const unlinkFile = ultil.promisify(fs.unlink);

const uploadAvatar = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const file = req.file!;

  //Check user whether already had an avatar
  const { customerAvatar } = await UserModel.findById(userId);
  const readStream = getFileStream(customerAvatar);

  //Delete old avatar
  if (customerAvatar && readStream) {
    const deleted = await deleteFile(customerAvatar);

    if (deleted) {
      console.log("deleted outdated avatar");
    }
  }

  const upload = await uploadFile(file);
  await unlinkFile(file.path);

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      customerAvatar: upload.Key,
    },
    { new: true },
  );

  if (user && upload) {
    // const returnUser = user._doc;
    // returnUser.avatarURL = upload.Location;

    res.status(StatusCodes.CREATED).json({
      // returnUser,
      // user,
      // upload,
      URL: upload.Location,
    });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Uploaded failed");
  }
};

const downloadAvatar = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const { customerAvatar } = await UserModel.findById(userId);
  const readStream = getFileStream(customerAvatar);
  if (readStream) {
    readStream.pipe(res);
  } else {
    res
      .status(StatusCodes.INSUFFICIENT_STORAGE)
      .send("This image is not in storage");
  }
};

export { uploadAvatar, downloadAvatar };
