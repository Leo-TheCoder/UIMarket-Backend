import { IUserRequest } from "../types/express";
import { Response } from "express";
import CommentModel from "../models/Comment.model";
import { StatusCodes } from "http-status-codes";
import AnswerModel from "../models/Answer.model";
import { BadRequestError } from "../errors";
import { getStatusVote } from "../utils/ultils";

const createComment = async (req: IUserRequest, res: Response) => {
  const answer = await AnswerModel.findById(req.params.answerId);
  if (answer) {
    const { userId } = req.user!;
    const comment = await CommentModel.create({
      ...req.body,
      userId,
      answerId: req.params.answerId,
    });
    res.status(StatusCodes.CREATED).json(comment);
  } else {
    throw new BadRequestError("Invalid answer ID");
  }
};

const getComments = async (req: IUserRequest, res: Response) => {
  const { answerId } = req.params;
  const comments = await CommentModel.find({ answerId })
    .sort({ createdAt: +1 })
    .populate("userId", "customerName");

  let result = comments;
  if (req.user) {
    result = [];
    for (const comment of comments) {
      const voteStatus = await getStatusVote(req.user.userId, comment._id);
      result.push({
        ...comment._doc,
        voteStatus,
      });
    }
  }

  res.status(StatusCodes.OK).json({
    comments: result,
  });
};

export { createComment, getComments };
