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
    userId: userId,
    questionTag: list,
    ...req.body,
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
      .sort({ totalComment: -1, totalUpvote: -1 })
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
    const vote = await VotingModel
      //
      .find({
        objectId: req.params.id,
        userId: req.user.userId,
      })
      .select({
        _id: 0,
        action: 1,
      });

    if (vote.length != 0) {
      if (vote[0] === 0) {
        voteStatus.downvote = true;
      } else {
        voteStatus.upvote = true;
      }
    }
  }

  //Find the question and increase its view by 1
  let question = await Question
    // .findById(req.params.id)
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

export {
  //
  createQuestion,
  getQuestions,
  getQuestionByID,
};
