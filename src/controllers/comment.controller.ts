import { IUserRequest } from "../types/express";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  GoneError,
  InternalServerError,
} from "../errors";
import { getStatusVote } from "../utils/statusVote";
import QuestionModel from "../models/Question.model";
import CommentModel from "../models/Comment.model";
import AnswerModel from "../models/Answer.model";
import * as Constants from "../constants";
import * as ErrorMessage from "../errors/error_message";

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
  tag?: string;
}
const createComment = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //Checking whether questionId is valid
  const question = await QuestionModel.findById(req.body.questionId);
  if (!question) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  }

  //Checking whether rootId is valid
  if (req.body.rootType === "Answer") {
    const answer = await AnswerModel.find({
      _id: req.body.rootId,
      questionId: req.body.questionId,
    });

    if (!answer) {
      throw new NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
    }
  } else if (req.body.rootId != req.body.questionId) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_ROOT_ID);
  }

  const comment = await CommentModel.create({
    ...req.body,
    userId,
  });

  //populate with user model
  await comment.populate("userId", "customerEmail customerName customerAvatar");

  res.status(StatusCodes.CREATED).json(comment);
};

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
    .populate("userId", "customerName customerEmail customerAvatar")
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
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_COMMENT_ID);
  } else if (comment.userId != userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (!req.body.commentContent) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
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

  //Validation
  if (!commemt) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_COMMENT_ID);
  } else if (commemt.userId != userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (commemt.commentStatus != 1) {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }

  commemt.commentStatus = 0;
  commemt.updateAt = new Date();
  const result = await commemt.save();

  if (result) {
    res.status(StatusCodes.OK).json(result);
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export {
  //
  createComment,
  getComments,
  deleteComment,
  updateComment,
};
