import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import Answer from "../models/Answer.model";
import * as Constants from "../constants";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
}

const createAnswer = async (req: IUserRequest, res: Response) => {
  const question = await Question.findById(req.params.questionId);

  if (question) {
    const { userId } = req.user!;
    const answer = await Answer.create({
      ...req.body,
      userId: userId,
      questionId: req.params.questionId,
    });
    res.status(StatusCodes.CREATED).json(answer);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send("Invalid question ID");
  }
};

const getAnswer = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await Answer.countDocuments();
  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const answers = await Answer
    //
    .find({
      questionId: req.params.questionId,
      answerStatus: 1,
    })
    // .populate({ path: "userId", select: ["customerName", "customerEmail"] })
    .then((answers) =>
      Answer.aggregate([
        {
          $addFields: {
            balanceVote: {
              $subtract: ["$totalUpvote", "$totalDownvote"],
            },
          },
        },
        { $sort: { bestAnswer: -1, balanceVote: -1 } },
        { $limit: limit },
        { $skip: (page - 1) * limit },
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
      ]),
    );

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    answers,
  });
};

export {
  //
  createAnswer,
  getAnswer,
};
