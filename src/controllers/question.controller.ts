import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import QuestionTag from "../models/QuestionTag.model";

//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList: [String]) => {
  const promises = [];
  for (const tag of tagList) {
    promises.push(
      QuestionTag.findOneAndUpdate(
        { tagName: tag },
        { $inc: { totalQuestion: +1 } },
        { new: true, upsert: true },
      )
    );
  }
  const tagObjects = await Promise.all(promises);
  return tagObjects.map((obj) => obj._id);
};

const createQuestion = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  const tagList: [String] = req.body.questionTag;
  const list = await createTagList(tagList);

  const question = await Question.create({ ...req.body, userId: userId, questionTag: list});
  res.status(StatusCodes.CREATED).json(question);
};

export { createQuestion };
