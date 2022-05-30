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
import { BadRequestError, NotFoundError } from "../errors";

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

export const rejectReport = async (req: IUserRequest, res: Response) => {
  const report = await ReportModel.findOne({
    _id: req.params.reportId,
    resolveFlag: 0,
  });

  if (!report) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_REPORT_ID);
  }

  const reportSolution = req.body.rejectReason;
  if (!reportSolution) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  report.reportSolution = reportSolution;
  report.resolveFlag = -1;
  const result = await report.save();
  res.status(StatusCodes.OK).json(result);
};

export const reportListEdu = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReportModel.countDocuments({
    resolveFlag: 0,
    objectType: { $in: ["Question", "Answer", "Comment"] },
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportModel.find({
    resolveFlag: 0,
    objectType: { $in: ["Question", "Answer", "Comment"] },
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: 1 })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    reports,
  });
};

export const reportListEC = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReportModel.countDocuments({
    resolveFlag: 0,
    objectType: { $in: ["Product", "Shop"] },
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportModel.find({
    resolveFlag: 0,
    objectType: { $in: ["Product", "Shop"] },
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: 1 })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    reports,
  });
};
