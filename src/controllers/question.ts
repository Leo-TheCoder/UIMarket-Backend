import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question";
import QuestionTag from "../models/QuestionTag";

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

  const tagList: [String] = req.body.tagList;
  const list = await createTagList(tagList);

  res.json(list);
  //const question = await Question.create({ ...req.body, _user_id: userId });
  //res.status(StatusCodes.CREATED).json({ question });
};

export { createQuestion };
