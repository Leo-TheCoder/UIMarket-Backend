//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import * as Constants from "../constants";

//Model
import QuestionTagModel from "../models/QuestionTag.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import {} from "../errors";

interface IQuery {
  tagName?: string;
  page?: string;
  limit?: string;
}

const getTags = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;
  const tagName = query.tagName || null;

  // if (!tagName || tagName?.length < 1) {
  //   //return res.status(StatusCodes.NO_CONTENT).send();
  //   const tags = await QuestionTagModel.find()
  //     .select("_id tagName totalQuestion")
  //     .lean();
  //   return res.status(StatusCodes.OK).json(tags);
  // }
  if (tagName) {
    const splitTags = tagName.split("&");
    const tags = await QuestionTagModel.find({ tagName: { $in: splitTags } })
      .select("_id tagName totalQuestion")
      .lean();
    return res.status(StatusCodes.OK).json(tags);
  }

  const total = await QuestionTagModel.countDocuments({
    totalQuestion: { $gt: 0 },
  });
  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const tags = await QuestionTagModel.find({
    totalQuestion: { $gt: 0 },
  })
    .sort({ totalQuestion: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    tags,
  });

  // const regexp = new RegExp("^" + tagName);
  // const tagsDoc = await QuestionTagModel.find(
  //   { tagName: regexp },
  //   { _id: 1, tagName: 1, totalQuestion: 1 },
  // ).lean();

  // res.status(StatusCodes.OK).json(tagsDoc);
};

export { getTags };
