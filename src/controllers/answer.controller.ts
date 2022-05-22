//Library
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import { ObjectId } from "mongodb";
import * as Constants from "../constants";
import { getStatusVote } from "../utils/statusVote";

//Model
import Question from "../models/Question.model";
import Answer from "../models/Answer.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  InternalServerError,
  NotFoundError,
} from "../errors";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

const createAnswer = async (req: IUserRequest, res: Response) => {
  const question = await Question.findById(req.params.questionId);

  if (question) {
    const { userId } = req.user!;
    let answer = await Answer.create({
      ...req.body,
      userId: userId,
      questionId: req.params.questionId,
    });

    answer = await Answer.populate(answer, {
      path: "userId",
      select: ["customerName", "customerEmail"],
    });

    res.status(StatusCodes.CREATED).json(answer);
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  }
};

const getAnswer = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await Answer.countDocuments({
    questionId: req.params.questionId,
  });

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const answers = await Answer.aggregate([
    {
      $match: {
        answerStatus: 1,
        questionId: new ObjectId(req.params.questionId),
      },
    },
    {
      $addFields: {
        balanceVote: {
          $subtract: ["$totalUpvote", "$totalDownvote"],
        },
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $sort: { bestAnswer: -1, balanceVote: -1 } },
    {
      $lookup: {
        from: "customers",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              customerName: 1,
              customerEmail: 1,
            },
          },
        ],
        as: "customerInfo",
      },
    },
  ]);

  if (answers.length != 0) {
    for (let i = 0; i < answers.length; i++) {
      let voteStatus = {
        upvote: false,
        downvote: false,
      };

      if (req.user) {
        voteStatus = await getStatusVote(req.user.userId, answers[i]._id);
      }

      answers[i].voteStatus = voteStatus;
    }
  }

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    answers,
  });
};

const deleteAnswer = async (req: IUserRequest, res: Response) => {
  //Checking whether user is answer's owner
  const answer = await Answer.findById(req.params.answerId);
  const { userId } = req.user!;

  if (!answer) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
  } else if (answer.userId != userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  }

  //Checking answer status
  if (answer.answerStatus == 1) {
    //Update answer status
    answer.answerStatus = 0;
    answer.updateAt = new Date();
    const result = await answer.save();

    //Update total answer
    const question = await Question.findByIdAndUpdate(
      answer.questionId,
      {
        $inc: { totalAnswer: -1 },
      },
      { new: true },
    );

    //Return response
    if (result && question) {
      res.status(StatusCodes.OK).json(result);
    } else {
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    }
  } else {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }
};

const updateAnswer = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //Checking whether user is answer's owner
  const answer = await Answer.findOne({
    _id: req.params.answerId,
    answerStatus: 1,
  });

  if (!answer) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
  } else if (answer.userId != userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (!req.body.answerContent) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  if (answer.answerContent != req.body.answerContent) {
    answer.answerContent = req.body.answerContent;
    answer.updateAt = new Date();

    const result = await answer.save();
    if (result) {
      res.status(StatusCodes.OK).json(result);
    } else {
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    }
  } else {
    res.status(StatusCodes.NO_CONTENT).send("Nothing's changed");
  }
};

export {
  //
  createAnswer,
  getAnswer,
  deleteAnswer,
  updateAnswer,
};
