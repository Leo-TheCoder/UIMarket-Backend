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
      return res.status(result.status).json(result.msg);
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
  })
  const question = await QuestionModel.findById(objectId, ["userId"]);
  //if users are voting their posts
  if(question.userId == userId) {
    return {
      msg: "CANNOT VOTE FOR THIER OWN POSTS",
      status: StatusCodes.BAD_REQUEST,
    }
  }

  //if user didn't vote for that object before...
  if (!votingDoc) {
    //create new voting object
    const newVotingDoc = await VotingModel.findOneAndUpdate(
      { userId, questionId, objectId },
      { action: 0 },
      { new: true, upsert: true }
    );
    const totalDownvote = await VotingModel.countDocuments({objectId, action: 0});
    //update question upvote number
    await QuestionModel.findOneAndUpdate(
      {
        _id: questionId,
      },
      { totalDownvote }
    );

    return {
      msg: "DOWNVOTED",
      status: StatusCodes.OK,
    }
  } 

  //if user has voted for object...
  else {
    if(votingDoc.action === 1) {
      votingDoc.action = 0;
      await votingDoc.save();
    }
    else {
      //removing voting object => unvote
      await votingDoc.remove();
    }

    const totalUpvote = await VotingModel.countDocuments({objectId, action: 1});
    const totalDownvote = await VotingModel.countDocuments({objectId, action: 0});

    //update voting number
    await QuestionModel.findOneAndUpdate(
      { _id: questionId },
      { totalUpvote, totalDownvote }
    );

    return {
      msg: "UNVOTED",
      status: StatusCodes.OK,
    }
  }
};
