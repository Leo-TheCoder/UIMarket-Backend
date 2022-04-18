import { IUserRequest } from "../types/express";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  GoneError,
} from "../errors";
import { getStatusVote } from "../utils/statusVote";
import QuestionModel from "../models/Question.model";
import CommentModel from "../models/Comment.model";
import AnswerModel from "../models/Answer.model";
import * as Constants from "../constants";
import UserModel from "../models/User.model";

const createComment = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //Checking whether questionId is valid
  const question = await QuestionModel.findById(req.body.questionId);
  if (!question) {
    throw new NotFoundError("Invalid Question Id");
  }

  //Checking whether rootId is valid
  if (req.body.rootType === "Answer") {
    const answer = await AnswerModel.find({
      _id: req.body.rootId,
      questionId: req.body.questionId,
    });

    if (!answer) {
      throw new NotFoundError("Invalid Answer Id");
    }
  } else if (req.body.rootId != req.body.questionId) {
    throw new BadRequestError("Invalid Root Id");
  }

  const comment = await CommentModel.create({
    ...req.body,
    userId,
  });

  //populate with user model
  await comment.populate("userId", "customerEmail customerName");

  res.status(StatusCodes.CREATED).json(comment);
};

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
  tag?: string;
}

const getComments = async (req: IUserRequest, res: Response) => {
  const { rootId } = req.params;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimitComments;

  const queryString = {
    rootId,
    commentStatus: 1,
  };

  const total = await CommentModel.countDocuments(queryString);
  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const comments = await CommentModel.find(queryString)
    .sort({ createdAt: +1 })
    .populate("userId", "customerName customerEmail")
    .skip((page - 1) * limit)
    .limit(limit);

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

  res
    .status(StatusCodes.OK)
    .json({ comments: result, totalPages, limit, page });
};

const updateComment = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const comment = await CommentModel.findOne({
    _id: req.params.commentId,
    commentStatus: 1,
  });

  //Validation
  if (!comment) {
    throw new NotFoundError("Invalid comment ID");
  } else if (comment.userId != userId) {
    res;
    throw new ForbiddenError("Only owner of this commemt can do this action");
  } else if (!req.body.commentContent) {
    throw new BadRequestError("Please input comment content");
  }

  //Update comment
  comment.commentContent = req.body.commentContent;
  comment.updateAt = new Date();
  const result = await comment.save();

  res.status(StatusCodes.OK).json(result);
};

const deleteComment = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const commemt = await CommentModel.findById(req.params.commentId);

  //Validate
  if (!commemt) {
    throw new NotFoundError("Invalid Comment ID");
  } else if (commemt.userId != userId) {
    throw new ForbiddenError("Only owner of this comment can do this question");
  } else if (commemt.commentStatus != 1) {
    throw new GoneError("This comment has already deleted");
  }

  commemt.commentStatus = 0;
  commemt.updateAt = new Date();
  const result = await commemt.save();

  if (result) {
    res.status(StatusCodes.OK).json(result);
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Deleted failed");
  }
};

export {
  //
  createComment,
  getComments,
  deleteComment,
  updateComment,
};
