import { IUserRequest } from "../types/express";
import { Response } from "express";
import QuestionModel from "../models/Question.model";
import AnswerModel from "../models/Answer.model";
import UserModel from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import UnauthenticatedErorr from "../errors/unauthenticated-error";

const getProfileActivity = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;

  const questions = await QuestionModel.find({ userId }, { totalUpvote: 1 });
  const answers = await AnswerModel.find({ userId }, { totalUpvote: 1 });

  let totalUpvote = 0;
  questions.map((question) => (totalUpvote += question.totalUpvote));
  answers.map((answer) => (totalUpvote += answer.totalUpvote));

  res.status(StatusCodes.OK).json({
    stat: {
      questions: questions.length,
      answers: answers.length,
      upvote: totalUpvote,
    },
  });
};

const updateProfile = async (req: IUserRequest, res: Response) => {
  const user = req.user!;

  const { customerName, customerDOB, customerAvatar, customerPhone } = req.body;

  const updatedUser = await UserModel.findByIdAndUpdate(user.userId, {
    customerName,
    customerDOB,
    customerAvatar,
    customerPhone,
  }, {
    new: true,
  });

  if(!updatedUser) {
    throw new UnauthenticatedErorr("Invalid user");
  }

  const doc = {...updatedUser._doc};
  delete doc.customerPassword;
  delete doc.authenToken;
  
  const result = {
    updatedUser: doc,
  }

  res.status(StatusCodes.OK).json(result)
};

export { getProfileActivity, updateProfile };
