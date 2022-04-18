import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  NotFoundError,
} from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import QuestionTag from "../models/QuestionTag.model";
import * as Constants from "../constants";
import AnswerModel from "../models/Answer.model";
import { getStatusVote } from "../utils/statusVote";
import { pointRollBack, pointTransaction } from "../utils/currencyTransaction";

//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList: [String]) => {
  const promises = [];
  for (const tag of tagList) {
    promises.push(
      QuestionTag.findOneAndUpdate(
        { tagName: tag },
        { $inc: { totalQuestion: +1 } },
        { new: true, upsert: true },
      ),
    );
  }
  const tagObjects = await Promise.all(promises);
  return tagObjects.map((obj) => obj._id);
};

//create question endpoint
const createQuestion = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;

  //get array of tags' list
  const tagList: [String] = req.body.questionTag;

  let list = [];
  if (!tagList || tagList.length < 1) {
    list = [];
  } else {
    list = await createTagList(tagList);
  }

  //Case bounty question
  if (req.body.questionBounty) {
    //Check bounty value
    if (req.body.questionBounty < 0) {
      throw new BadRequestError("Bounty must greater than 0");
    }

    //Check bounty due date
    if (!req.body.bountyDueDate) {
      throw new BadRequestError("Bounty must have due date");
    }
    const dueDate = new Date(req.body.bountyDueDate);

    //Checking valid due date
    var diff = Math.abs(dueDate.getTime() - new Date().getTime());
    var diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    // console.log(diffDays);

    if (
      diffDays < Constants.minBountyDueDate ||
      diffDays > Constants.maxBountyDueDate
    ) {
      throw new BadRequestError(
        ` Due date at least ${Constants.minBountyDueDate} day(s) and maximum ${Constants.maxBountyDueDate} days`,
      );
    }

    //Checking valid balance
    const changeAmount = req.body.questionBounty * -1;
    const transaction = await pointTransaction(userId, changeAmount);
    if (transaction) {
      req.body.bountyActive = 1;
    }

    //Create question
    const question = await Question.create({
      ...req.body,
      userId: userId,
      questionTag: list,
    });

    if (!question && req.body.questionBounty) {
      await pointRollBack(userId, transaction._id, changeAmount);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Create failed");
    } else {
      res.status(StatusCodes.CREATED).json(question);
    }
  } else {
    //Normal question
    const question = await Question.create({
      ...req.body,
      userId: userId,
      questionTag: list,
    });

    res.status(StatusCodes.CREATED).json(question);
  }
};

interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
  tag?: string;
}

const getQuestions = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;
  const tag = query.tag;
  const selectWith = query.selectWith?.toLowerCase().trim() || "all";

  //Handle with Query Parameters
  var queryString: any = { questionStatus: 1 };

  //Checking selectWith option
  if (selectWith === "bounty") {
    queryString.questionBounty = { $gt: 0 };
  } else if (selectWith === "popular") {
    queryString.questionBounty = { $lte: 0 };
  }

  //Checking tag options
  if (tag === "true") {
    const tagList = req.body.tag;

    if (!tagList) {
      throw new BadRequestError("Please insert tag in the body");
    }
    queryString.questionTag = { $in: tagList };
  }

  const total = await Question.countDocuments(queryString);
  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const questions = await Question.find(queryString)
    .sort({ questionBounty: -1, totalView: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("questionTag", "tagName")
    .populate("userId", "customerName")
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    questions,
  });
};

const getQuestionByID = async (req: IUserRequest, res: Response) => {
  //Voting Status of user for this question
  let voteStatus = {
    upvote: false,
    downvote: false,
  };

  //Checking logged in user whether voted for this question
  if (req.user) {
    voteStatus = await getStatusVote(req.user.userId, req.params.id);
  }

  //Find the question and increase its view by 1
  let question = await Question
    //
    .findByIdAndUpdate(req.params.id, { $inc: { totalView: 1 } })
    .populate("questionTag", "tagName")
    .populate({ path: "userId", select: ["customerName", "customerEmail"] });

  //Checking whether there was a question or not
  if (question) {
    const { _doc } = question;
    _doc.voteStatus = voteStatus;

    res.status(StatusCodes.OK).json({ _doc });
  } else {
    throw new NotFoundError("Invalid Question ID");
  }
};

const chooseBestAnswer = async (req: IUserRequest, res: Response) => {
  //Checking whether this user is owner of this post
  const { userId } = req.user!;
  const question = await Question.findOne({
    _id: req.params.questionId,
    questionStatus: 1,
  });
  const answer = await AnswerModel.findOne({
    _id: req.params.answerId,
    questionId: req.params.questionId,
    answerStatus: 1,
  });

  if (!question) {
    throw new NotFoundError("Invalid Question ID");
  } else if (!answer) {
    throw new NotFoundError("Invalid Answer ID");
  } else if (userId != question.userId) {
    throw new ForbiddenError("Only owner of this post can do this action");
  }

  //Checking whether this question have best answer or not
  let currentBestAnswer = question.bestAnswer || null;

  if (currentBestAnswer) {
    currentBestAnswer = String(currentBestAnswer);
  }

  //Case already had best answer
  if (currentBestAnswer) {
    //Undo best answer
    if (currentBestAnswer === req.params.answerId) {
      answer.bestAnswer = 0;
      question.bestAnswer = null;

      const result = await answer.save();
      await question.save();

      res
        .status(StatusCodes.OK)
        .json({ Acction: "Unvote best answer", result });
    }
    //Choose new best answer
    else {
      const oldBestAnswer = await AnswerModel.findById(currentBestAnswer);

      if (!oldBestAnswer) {
        throw new GoneError("Something went wrong with database");
      }

      oldBestAnswer.bestAnswer = 0;
      question.bestAnswer = answer._id;
      answer.bestAnswer = 1;

      await oldBestAnswer.save();
      await question.save();
      const result = await answer.save();

      res
        .status(StatusCodes.OK)
        .json({ Action: "Choose another best answer", result });
    }
  }
  //Case doesn't have best answer
  else {
    answer.bestAnswer = 1;
    question.bestAnswer = answer._id;

    const result = await answer.save();
    await question.save();

    res.status(StatusCodes.OK).json({ Action: "Choose best answer", result });
  }
};

const deleteQuestion = async (req: IUserRequest, res: Response) => {
  //Checking whether this user is owner of this post
  const { userId } = req.user!;
  const question = await Question.findById(req.params.questionId);

  if (!question) {
    throw new NotFoundError("Invalid Question ID");
  } else if (userId != question.userId) {
    throw new ForbiddenError("Only owner of this post can do this action");
  } else if (question.questionStatus == 0) {
    throw new GoneError("This question has already deleted");
  }

  //Set question status to 0 and decrease total question in tag by 1
  question.questionStatus = 0;
  question.questionTag.map(async (tag: string) => {
    let tags = await QuestionTag.updateOne(
      { _id: tag },
      { $inc: { totalQuestion: -1 } },
    );

    if (!tags) {
      throw new BadRequestError("Invalid Question Tag ID");
    }
  });
  const result = await question.save();

  //Return result
  if (result) {
    res.status(StatusCodes.OK).json(result);
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Delete failed");
  }
};

const updateQuestion = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const question = await Question.findOne({
    _id: req.params.questionId,
    questionStatus: 1,
  });

  if (!question) {
    throw new NotFoundError("Invalid Question ID");
  } else if (userId != question.userId) {
    throw new ForbiddenError("Only owner of this question can do this action");
  }

  const questionTitle = req.body.questionTitle || question.questionTitle;
  const questionContent = req.body.questionContent || question.questionContent;
  const questionBounty = req.body.questionBounty || question.questionBounty;

  if (
    questionTitle === question.questionTitle &&
    questionContent === question.questionContent &&
    questionBounty === question.questionBounty
  ) {
    res.status(StatusCodes.OK).send("Nothing updated");
  } else {
    question.updateAt = new Date();
    question.questionTitle = questionTitle;
    question.questionContent = questionContent;
    question.questionBounty = questionBounty;

    const result = await question.save();

    res.status(StatusCodes.OK).json(result);
  }
};

export {
  createQuestion,
  getQuestions,
  getQuestionByID,
  chooseBestAnswer,
  deleteQuestion,
  updateQuestion,
};
