import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import QuestionModel from "../models/Question.model";
import VotingModel from "../models/Voting.model";

const upvote = async (req: IUserRequest, res: Response) => {
  const { type, questionId, objectId } = req.body;
  const userId = req.user?.userId!;

  switch (type) {
    case "question":
        const result = await upvoteQuestion(userId, questionId, objectId);
        return res.status(StatusCodes.OK).json(result);
    case "answer":
    case "comment":
    default:
      return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export {upvote};

const upvoteQuestion = async (
  userId: string,
  questionId: string,
  objectId: string
) => {
  //get document of voting 
  const votingDoc = await VotingModel.findOne({
    userId,
    questionId,
    objectId,
  });
  //if user didn't vote for that object before...
  if (!votingDoc) {
    //create new voting object
    const newVotingDoc = await VotingModel.findOneAndUpdate(
      { userId, questionId, objectId },
      { action: 1 },
      { new: true, upsert: true }
    );

    //update question upvote number
    await QuestionModel.findOneAndUpdate(
      {
        _id: questionId,
      },
      { $inc: { totalUpvote: +1 } }
    );

    return "UPVOTED";
  } 

  //if user has voted for object...
  else {
    //removing voting object => unvote
    await votingDoc.remove();

    //update voting number
    await QuestionModel.findOneAndUpdate(
      { _id: questionId },
      { $inc: { totalUpvote: -1 } }
    );

    return "UNVOTED"
  }
};
