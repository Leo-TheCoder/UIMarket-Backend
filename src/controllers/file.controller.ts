import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { BadRequestError, CustomError } from "../errors";
import * as Constants from "../constants";
import { generateUploadURL } from "../utils/s3";
import fs from "fs";
import ultil from "util";
import * as ErrorMessage from "../errors/error_message";

// const unlinkFile = ultil.promisify(fs.unlink);

//BE Solution
// const uploadAvatar = async (req: IUserRequest, res: Response) => {
//   const { userId } = req.user!;
//   const file = req.file!;

//   const upload = await uploadFile(file, "avatar");
//   await unlinkFile(file.path);

//   const user = await UserModel.findByIdAndUpdate(
//     userId,
//     {
//       customerAvatar: upload.Key,
//     },
//     { new: true },
//   );

//   if (user && upload) {
//     res.status(StatusCodes.CREATED).json(upload.Location);
//   } else {
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Upload failed");
//   }
// };

// const downloadAvatar = async (req: IUserRequest, res: Response) => {
//   const { userId } = req.user!;
//   const { customerAvatar } = await UserModel.findById(userId);
//   const readStream = getFileStream(customerAvatar);
//   if (readStream) {
//     readStream.pipe(res);
//   } else {
//     res
//       .status(StatusCodes.INSUFFICIENT_STORAGE)
//       .send("This image is not in storage");
//   }
// };

interface IQuery {
  folder?: string;
  isPrivate?: string;
}

//FE Solution
const uploadURL = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const folder = query.folder;
  const isPrivate = query.isPrivate === "true" || false;

  if (!folder || !isPrivate) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  const url = await generateUploadURL(folder, isPrivate).catch((err) => {
    throw new CustomError(err.msg);
  });

  if (url) {
    res.status(StatusCodes.OK).send({ url });
  }
};

export {
  uploadURL,
  // uploadAvatar
};
