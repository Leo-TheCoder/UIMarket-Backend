import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import QuestionTag from "../models/QuestionTag.model";

//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList: [String]) => {
  const promises = [];
  for (const tag of tagList) {
    promises.push(
      QuestionTag.findOneAndUpdate(
        { tagName: tag },
        { $inc: { totalQuestion: +1 } },
        { new: true, upsert: true }
      )
    );
  }
  const tagObjects = await Promise.all(promises);
  return tagObjects.map((obj) => obj._id);
};

//create question endpoint
const createQuestion = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //get array of tags' list
  const tagList: [String] = req.body.questionTag;
  const list = await createTagList(tagList);

  const question = await Question.create({
    ...req.body,
    userId: userId,
    questionTag: list,
  });
  res.status(StatusCodes.CREATED).json(question);
};

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

const getQuestions = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || 1;
  const limit = parseInt(query.limit!) || 10;
  
  const selectWith = query.selectWith?.toLowerCase().trim() || "popular";
  
  //Get bounty question
  if(selectWith === "bounty") {
    const total = await Question.countDocuments({questionBounty: {$gt: 0}});
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({questionBounty: {$gt: 0}})
      .sort({ questionBounty: -1 , totalView: -1})
      .skip((page - 1) * limit) //Notice here
      .limit(limit)
      .populate("questionTag", "tagName -_id")
      .populate("userId", "customerName -_id");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
    
  } 

  //Get popular question
  else {
    const total = await Question.countDocuments({questionBounty: {$lte: 0}});
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({questionBounty: {$lte: 0}})
      .sort({ totalComment: -1 , totalUpvote: -1})
      .skip((page - 1) * limit) //Notice here
      .limit(limit)
      .populate("questionTag", "tagName -_id")
      .populate("userId", "customerName -_id");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  }

};

const getQuestionByID = async (req: Request, res: Response) => {
  const question = await Question
    // .findById(req.params.id)
    .findByIdAndUpdate(req.params.id, { $inc: { totalView: 1 } })
    .populate("questionTag", "tagName -_id")
    .populate("userId", "customerName -_id");

  res.status(StatusCodes.OK).json({ question });
};

export { createQuestion, getQuestions, getQuestionByID };
