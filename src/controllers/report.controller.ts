//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import * as Constants from "../constants";

//Model
import ProductModel from "../models/Product.model";
import ReportModel from "../models/Report.model";
import ReportStatusModel from "../models/ReportStatus.model";
import QuestionModel from "../models/Question.model";
import AnswerModel from "../models/Answer.model";
import CommentModel from "../models/Comment.model";
import ShopModel from "../models/Shop.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import { BadRequestError, InternalServerError, NotFoundError } from "../errors";
import { updateTagList } from "./question.controller";

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

  //Two phase commit
  try {
    const session = await ReportModel.startSession();
    await session.withTransaction(async () => {
      const reports = await ReportModel.create(
        [
          {
            userId: userId,
            ...req.body,
          },
        ],
        {
          session,
        },
      );
      const report = reports[0];
      await ReportStatusModel.findOneAndUpdate(
        { reportObject: report.reportObject, resolveFlag: 0 },
        { $inc: { reportQuantity: 1 }, objectType: req.body.objectType },
        { session, returnOriginal: false, new: true, upsert: true },
      );
      return res.status(StatusCodes.CREATED).json(report);
    });
  } catch (error) {
    throw new InternalServerError("Error");
  }
};

export const rejectReport = async (req: Request, res: Response) => {
  const report = await ReportStatusModel.findOne({
    reportObject: req.params.reportId,
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

  const reportDetail = await ReportModel.updateMany(
    { reportObject: req.params.reportId, reportStatus: 1 },
    { reportStatus: 0 },
  );

  res.status(StatusCodes.OK).json(result);
};

export const reportListEdu = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReportStatusModel.countDocuments({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
    objectType: { $in: ["Question", "Answer", "Comment"] },
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportStatusModel.find({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
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

  const total = await ReportStatusModel.countDocuments({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
    objectType: { $in: ["Product", "Shop"] },
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportStatusModel.find({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
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

export const reportListAll = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReportStatusModel.countDocuments({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportStatusModel.find({
    resolveFlag: 0,
    reportQuantity: { $gte: Constants.minReportQuantity },
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

export const acceptReport = async (req: Request, res: Response) => {
  const report = await ReportStatusModel.findOne({
    reportObject: req.params.reportId,
    resolveFlag: 0,
  });
  if (!report) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_REPORT_ID);
  }
  const model = report.objectType;
  let solvedReport;

  switch (model) {
    case "Question":
      const question = await QuestionModel.findByIdAndUpdate(
        report.reportObject,
        { questionStatus: 0 },
        { new: true },
      );
      solvedReport = question;
      await updateTagList(question.questionTag);
      break;
    case "Answer":
      const answer = await AnswerModel.findByIdAndUpdate(
        report.reportObject,
        { answerStatus: 0 },
        { new: true },
      );
      solvedReport = answer;
      break;
    case "Comment":
      const comment = await CommentModel.findByIdAndUpdate(
        report.reportObject,
        { commentStatus: 0 },
        { new: true },
      );
      solvedReport = comment;
      break;
    case "Product":
      const product = await ProductModel.findByIdAndUpdate(
        report.reportObject,
        { productStatus: 0, isBanned: 1 },
        { new: true },
      );
      solvedReport = product;
      break;
    case "Shop":
      const shop = await ShopModel.findByIdAndUpdate(
        report.reportObject,
        { shopStatus: 0 },
        { new: true },
      );
      solvedReport = shop;
      break;
  }
  report.reportSolution = "Hide object";
  report.resolveFlag = 1;
  await report.save();

  const reportDetail = await ReportModel.updateMany(
    { reportObject: req.params.reportId, reportStatus: 1 },
    { reportStatus: 0 },
  );

  res.status(StatusCodes.OK).json(solvedReport);
};

export const getReportDetail = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await ReportModel.countDocuments({
    reportObject: req.params.objectId,
    reportStatus: 1,
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const reports = await ReportModel.find({
    reportObject: req.params.objectId,
    reportStatus: 1,
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
