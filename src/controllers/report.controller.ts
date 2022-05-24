//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import ProductModel from "../models/Product.model";
import ReportModel from "../models/Report.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import { BadRequestError } from "../errors";

interface IQuery {
  page?: string;
  limit?: string;
}

export const createReport = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const validType = ["Question", "Answer", "Comment", "Product"];

  //Checking body
  if (!req.body.reportObject || !req.body.reason || !req.body.objectType) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  } else if (!validType.includes(req.body.objectType)) {
    throw new BadRequestError(
      "Valid types are Question, Answer, Comment or Product",
    );
  }

  const report = await ReportModel.create({
    userId: userId,
    ...req.body,
  });

  res.status(StatusCodes.CREATED).json(report);
};
