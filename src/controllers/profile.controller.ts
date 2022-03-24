import { IUserRequest } from "../types/express";
import { Response } from "express";
import QuestionModel from "../models/Question.model";
import AnswerModel from "../models/Answer.model";
import { StatusCodes } from "http-status-codes";

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

export { getProfileActivity };
