import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import QuestionModel from "../models/Question.model";
import VotingModel from "../models/Voting.model";

const upvote = async (req: IUserRequest, res: Response) => {
  const { type, questionId, objectId } = req.body;
  const userId = req.user?.userId!;

  ///Non trigger solution
  // switch (type) {
  //   case "question":
  //     const result = await upvoteQuestion(userId, questionId, objectId);
  //     return res.status(result.status).json(result.msg);
  //   case "answer":
  //   case "comment":
  //   default:
  //     return res.status(StatusCodes.BAD_REQUEST).send();
  // }

  //Trigger solution
  const validType: Array<string> = ["Question", "Comment", "Answer"];
  if (!type) {
    throw new BadRequestError("Please provide type of object");
  } else if (!validType.includes(type)) {
    throw new BadRequestError("Valid types are: Question, Answer and Comment");
  }

  const result = await upvoteObject(userId, questionId, objectId, type);
  return res.status(result.status).json(result.msg);
};

export { upvote };

const upvoteQuestion = async (
  userId: string,
  questionId: string,
  objectId: string,
) => {
  //get document of voting
  const votingDoc = await VotingModel.findOne({
    userId,
    questionId,
    objectId,
  });
  const question = await QuestionModel.findById(objectId, ["userId"]);
  //if users are voting their posts
  if (question.userId == userId) {
    return {
      msg: "CANNOT VOTE FOR THIER OWN POSTS",
      status: StatusCodes.BAD_REQUEST,
    };
  }

  //if user didn't vote for that object before...
  if (!votingDoc) {
    //create new voting object
    const newVotingDoc = await VotingModel.findOneAndUpdate(
      { userId, questionId, objectId },
      { action: 1 },
      { new: true, upsert: true },
    );
    const totalUpvote = await VotingModel.countDocuments({
      objectId,
      action: 1,
    });
    //update question upvote number
    await QuestionModel.findOneAndUpdate(
      {
        _id: questionId,
      },
      { totalUpvote },
    );

    return {
      msg: "UPVOTED",
      status: StatusCodes.OK,
    };
  }

  //if user has voted for object...
  else {
    let msg = "";
    if (votingDoc.action === 0) {
      votingDoc.action = 1;
      await votingDoc.save();
      msg = "UPVOTED";
    } else {
      //removing voting object => unvote
      await votingDoc.remove();
      msg = "UNVOTED";
    }

    const totalUpvote = await VotingModel.countDocuments({
      objectId,
      action: 1,
    });
    const totalDownvote = await VotingModel.countDocuments({
      objectId,
      action: 0,
    });

    //update voting number
    await QuestionModel.findOneAndUpdate(
      { _id: questionId },
      { totalUpvote, totalDownvote },
    );

    return {
      msg,
      status: StatusCodes.OK,
    };
  }
};

const upvoteObject = async (
  userId: string,
  questionId: string,
  objectId: string,
  type: string,
) => {
  const votingDoc = await VotingModel.findOne({
    userId,
    questionId,
    objectId,
    type,
  });

  if (!votingDoc) {
    await VotingModel.create(
      {
        userId,
        questionId,
        objectId,
        type,
        action: 1,
      },
      (err, vote) => {
        if (err)
          return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            msg: err,
          };
      },
    );

    return {
      status: StatusCodes.OK,
      msg: "UPVOTED",
    };
  } else {
    //if upvoted
    if (votingDoc.action === 1) {
      await votingDoc.remove();
      return {
        status: StatusCodes.OK,
        msg: "UNVOTED",
      };
    }
    //if downvoted
    else {
      await votingDoc.remove();
      await VotingModel.create(
        {
          userId,
          questionId,
          objectId,
          type,
          action: 1,
        },
        (err, vote) => {
          if (err)
            return {
              status: StatusCodes.INTERNAL_SERVER_ERROR,
              msg: err,
            };
        },
      );
      return {
        status: StatusCodes.OK,
        msg: "UPVOTED",
      };
    }
  }
};
