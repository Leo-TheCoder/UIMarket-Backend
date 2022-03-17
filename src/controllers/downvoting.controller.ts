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

export { downvote };

const downvoteQuestion = async (
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
      { action: 0 },
      { new: true, upsert: true }
    );

    //update question upvote number
    await QuestionModel.findOneAndUpdate(
      {
        _id: questionId,
      },
      { $inc: { totalDownvote: +1 } }
    );

    return "DOWNVOTED";
  } 
  
  //if user has voted for object...
  else {
    //removing voting object => unvote
    await votingDoc.remove();

    //update voting number
    await QuestionModel.findOneAndUpdate(
      { _id: questionId },
      { $inc: { totalDownvote: -1 } }
    );

    return "UNVOTED";
  }
};
