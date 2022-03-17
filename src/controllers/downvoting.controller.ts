import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import QuestionModel from "../models/Question.model";
import VotingModel from "../models/Voting.model";

const downvote = async (req: IUserRequest, res: Response) => {
  const { type, questionId, objectId } = req.body;
  const userId = req.user?.userId!;

  switch (type) {
    case "question":
        const result = await downvoteQuestion(userId, questionId, objectId);
        return res.status(StatusCodes.OK).json(result);
    case "answer":
    case "comment":
    default:
      return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export {downvote};

const downvoteQuestion = async (
  userId: string,
  questionId: string,
  objectId: string
) => {
  const votingDoc = await VotingModel.findOne({
    userId,
    questionId,
    objectId,
  });
  if (!votingDoc) {
    const newVotingDoc = await VotingModel.findOneAndUpdate(
      { userId, questionId, objectId },
      { action: 0 },
      { new: true, upsert: true }
    );

    await QuestionModel.findOneAndUpdate(
      {
        _id: questionId,
      },
      { $inc: { totalDownvote: +1 } }
    );

    return "DOWNVOTED";
  } else {
    await votingDoc.remove();

    await QuestionModel.findOneAndUpdate(
      { _id: questionId },
      { $inc: { totalDownvote: -1 } }
    );

    return "UNVOTED"
  }
};
