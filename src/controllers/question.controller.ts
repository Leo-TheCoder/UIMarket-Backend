import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import QuestionTag from "../models/QuestionTag.model";
import VotingModel from "../models/Voting.model";
import { downvote } from "./downvoting.controller";
import { upvote } from "./upvoting.controller";
import * as Constants from "../constants";
import { getStatusVote } from "../utils/ultils";
import AnswerModel from "../models/Answer.model";

//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList: [String]) => {
  const promises = [];
  for (const tag of tagList) {
    promises.push(
      QuestionTag.findOneAndUpdate(
        { tagName: tag },
        { $inc: { totalQuestion: +1 } },
        { new: true, upsert: true },
      ),
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
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  // const a = query.selectWith;

  const selectWith = query.selectWith?.toLowerCase().trim() || "all";

  //Get bounty question
  if (selectWith === "bounty") {
    const total = await Question.countDocuments({ questionBounty: { $gt: 0 } });
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({ questionBounty: { $gt: 0 } })
      .sort({ questionBounty: -1, totalView: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate("userId", "customerName");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  } else if (selectWith === "popular") {
    //Get popular question
    const total = await Question.countDocuments({
      questionBounty: { $lte: 0 },
    });
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({ questionBounty: { $lte: 0 } })
      .sort({ totalAnswer: -1, totalUpvote: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate("userId", "customerName");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  } else {
    //Get all question
    const total = await Question.countDocuments();
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate({ path: "userId", select: ["customerName", "customerEmail"] });
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  }
};

const getQuestionByID = async (req: IUserRequest, res: Response) => {
  //Voting Status of user for this question
  let voteStatus = {
    upvote: false,
    downvote: false,
  };

  //Checking logged in user whether voted for this question
  if (req.user) {
    voteStatus = await getStatusVote(req.user.userId, req.params.id);
  }

  //Find the question and increase its view by 1
  let question = await Question
    //
    .findByIdAndUpdate(req.params.id, { $inc: { totalView: 1 } })
    .populate("questionTag", "tagName")
    .populate({ path: "userId", select: ["customerName", "customerEmail"] });

  //Checking whether there was a question or not
  if (question) {
    const { _doc } = question;
    _doc.voteStatus = voteStatus;

    res.status(StatusCodes.OK).json({
      _doc,
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST).send("Invalid Question ID");
  }
};

const chooseBestAnswer = async (req: IUserRequest, res: Response) => {
  //Checking whether this user is owner of this post
  const { userId } = req.user!;
  console.log(userId);
  const question = await Question.findById(req.params.questionId);

  if (userId != question.userId) {
    throw new BadRequestError("Only owner of this post can do this action");
  }

  //Checking whether this question have best answer or not
  const answer = await AnswerModel.find({
    questionId: req.params.questionId,
    bestAnswer: 1,
  });
  if (answer.length > 0) {
    throw new BadRequestError("This question already have best answer");
  }

  const bestAnswer = await AnswerModel.findByIdAndUpdate(
    req.params.answerId,
    { bestAnswer: 1 },
    { new: true, lean: true },
  );

  if (bestAnswer) {
    res.status(StatusCodes.OK).json(bestAnswer);
  }
};

export {
  //
  createQuestion,
  getQuestions,
  getQuestionByID,
  chooseBestAnswer,
};
