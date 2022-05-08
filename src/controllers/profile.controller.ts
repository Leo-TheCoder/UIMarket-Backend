import { IUserRequest } from "../types/express";
import { Response } from "express";
import QuestionModel from "../models/Question.model";
import AnswerModel from "../models/Answer.model";
import UserModel from "../models/User.model";
import { StatusCodes } from "http-status-codes";
import UnauthenticatedErorr from "../errors/unauthenticated-error";
import { NotFoundError } from "../errors";
import * as ErrorMessage from "../errors/error_message";

type TagStatType = {
  _id?: String;
  upvote?: number;
  numOfPosts: number;
};
type TagStatsType = {
  [tagName: string]: TagStatType;
};

const getProfileActivity = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;

  //Promise fetch questions of user
  const questionsPromise = QuestionModel.find(
    { userId },
    { totalUpvote: 1, questionTitle: 1, totalDownvote: 1, questionBounty: 1 },
  ).populate({
    path: "questionTag",
    select: "tagName",
  });

  //Promise fetch answers of user
  const answersPromise = AnswerModel.find(
    { userId },
    { totalUpvote: 1 },
  ).populate({
    path: "questionId",
    populate: { path: "questionTag", select: "tagName" },
    select: "questionTitle",
  });

  //Get result from promises
  const [questions, answers] = await Promise.all([
    questionsPromise,
    answersPromise,
  ]);

  //Total upvote from question and answer
  let totalUpvote = 0;

  //Object to store tag stat
  let tagStats: TagStatsType = {};

  questions.map((question) => {
    //get sum of total upvote from questions
    totalUpvote += question.totalUpvote;

    //get number of upvote and post from every tag of question
    for (const tag of question.questionTag) {
      const tagStat = tagStats[tag.tagName]
        ? tagStats[tag.tagName]
        : ({
            _id: tag._id,
            numOfPosts: 0,
            upvote: 0,
          } as TagStatType);

      tagStat.numOfPosts++;
      tagStat.upvote += question.totalUpvote;

      tagStats[tag.tagName] = tagStat;
    }
  });
  answers.map((answer) => {
    //get sum of total upvote from answers
    totalUpvote += answer.totalUpvote;

    //get number of upvote and post from every tag of answer
    for (const tag of answer.questionId.questionTag) {
      const tagStat = tagStats[tag.tagName]
        ? tagStats[tag.tagName]
        : ({
            _id: tag._id,
            numOfPosts: 0,
            upvote: 0,
          } as TagStatType);

      tagStat.numOfPosts++;
      tagStat.upvote += answer.totalUpvote;

      tagStats[tag.tagName] = tagStat;
    }
  });

  //Convert Object tagStats to array (more convenient for FE)
  const tagStatsArray: {
    tagName: string;
    _id?: String;
    numOfPosts: number;
    upvote?: number;
  }[] = [];
  Object.keys(tagStats).forEach((key) => {
    tagStatsArray.push({
      tagName: key,
      ...tagStats[key],
    });
  });

  //Delete redundant fields
  const questionResult = questions.map((question) => {
    const doc = { ...question._doc };
    delete doc.questionTag;
    delete doc.questionBounty;
    return doc;
  });
  const answerResult = answers.map((answer) => {
    //deep copy
    const doc = JSON.parse(JSON.stringify(answer._doc));
    delete doc.questionId.questionTag;
    return doc;
  });
  //Fill question with bounty
  const questionBountyResult = questions.filter((question) => {
    delete question._doc.questionTag;
    return question.questionBounty > 0;
  });

  res.status(StatusCodes.OK).json({
    stat: {
      questions: questions.length,
      answers: answers.length,
      upvote: totalUpvote,
    },
    questions: questionResult,
    answers: answerResult,
    tagStats: tagStatsArray,
    questionBounty: questionBountyResult,
  });
};

const getProfileInfo = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;

  const userDoc = await UserModel.findById(
    userId,
    "-authenToken -customerPassword -createdAt -updatedAt",
  );

  if (!userDoc) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  const user = JSON.parse(JSON.stringify(userDoc._doc));

  if (!(req.user && req.user.userId === userId)) {
    delete user.customerWallet;
    delete user.customerStatus;
  }

  res.status(StatusCodes.OK).json({ user });
};

const updateProfile = async (req: IUserRequest, res: Response) => {
  const user = req.user!;

  const {
    customerName,
    customerDOB,
    customerAvatar,
    customerPhone,
    customerBio,
  } = req.body;

  const updatedUser = await UserModel.findByIdAndUpdate(
    user.userId,
    {
      customerName,
      customerDOB,
      customerAvatar,
      customerPhone,
      customerBio,
    },
    {
      new: true,
    },
  );

  if (!updatedUser) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  const doc = JSON.parse(JSON.stringify(updatedUser._doc));
  delete doc.customerPassword;
  delete doc.authenToken;

  const result = {
    updatedUser: doc,
  };

  res.status(StatusCodes.OK).json(result);
};

export { getProfileActivity, updateProfile, getProfileInfo };
