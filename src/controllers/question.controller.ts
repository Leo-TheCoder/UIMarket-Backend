import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  InternalServerError,
  NotFoundError,
} from "../errors";
import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
import Question from "../models/Question.model";
import QuestionTagModel from "../models/QuestionTag.model";
import * as Constants from "../constants";
import AnswerModel from "../models/Answer.model";
import { getStatusVote } from "../utils/statusVote";
import { pointRollBack, pointTransaction } from "../utils/currencyTransaction";
import * as ErrorMessage from "../errors/error_message";
interface IQuery {
  page?: string;
  limit?: string;
  selectWith?: string;
  tag?: string;
  title?: string;
}

//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList: [String]) => {
  const promises = [];
  for (const tag of tagList) {
    promises.push(
      QuestionTagModel.findOneAndUpdate(
        { tagName: tag },
        { $inc: { totalQuestion: +1 } },
        { new: true, upsert: true }
      )
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
  if (req.body.questionBounty && req.body.questionBounty > 0) {
    //Check bounty value
    if (
      req.body.questionBounty < Constants.minBounty ||
      req.body.questionBounty > Constants.maxBounty
    ) {
      throw new BadRequestError(
        `Bounty must in range ${Constants.minBounty} - ${Constants.maxBounty}`
      );
    }

    //Check bounty due date
    if (!req.body.bountyDueDate) {
      throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const dueDate = new Date(req.body.bountyDueDate);

    //Checking valid due date
    var diff = Math.abs(dueDate.getTime() - new Date().getTime());
    var diffDays = Math.ceil(diff / (1000 * 3600 * 24));

    if (
      diffDays < Constants.minBountyDueDate ||
      diffDays > Constants.maxBountyDueDate
    ) {
      throw new BadRequestError(
        ` Due date at least ${Constants.minBountyDueDate} day(s) and maximum ${Constants.maxBountyDueDate} days`
      );
    }

    const awardDueDate = new Date(dueDate.getTime());

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
      awardDueDate: awardDueDate.setDate(awardDueDate.getDate() + 14),
    });

    if (!question && req.body.bountyActive != 1) {
      await pointRollBack(userId, transaction._id, changeAmount);
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
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

const searchWithTitle = async (
  page: number,
  limit: number,
  title: string,
  queryString: any,
  projection: any
) => {
  const selectOption = projection;

  const totalQuestion = await Question.aggregate([
    {
      $search: {
        index: "questionTitle",
        text: {
          path: "questionTitle",
          query: decodeURIComponent(title),
        },
      },
    },
    { $match: queryString },
    { $count: "total" },
  ]);

  const total = totalQuestion[0].total;

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  const questions = await Question.aggregate([
    {
      $search: {
        index: "questionTitle",
        text: {
          path: "questionTitle",
          query: decodeURIComponent(title),
        },
      },
    },
    { $match: queryString },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: selectOption },
  ]);

  await Question.populate(questions, {
    path: "questionTag",
    select: { tagName: 1 },
  });
  await Question.populate(questions, {
    path: "userId",
    select: { customerName: 1 },
  });
  return {
    questions,
    totalPages,
  };
};

const getQuestions = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;
  const tag = query.tag;
  const selectWith = query.selectWith?.toLowerCase().trim() || "all";
  const title = query.title;

  //Handle with Query Parameters
  var queryString: any = { questionStatus: 1 };
  let projection = { questionContent: 0, __v: 0 };

  //Checking selectWith option
  if (selectWith === "bounty") {
    queryString.questionBounty = { $gt: 0 };
  } else if (selectWith === "popular") {
    queryString.questionBounty = { $lte: 0 };
  }

  if (tag) {
    const tagList: string[] = tag.split(",");
    const tags = await QuestionTagModel.find({ tagName: { $in: tagList } });
    const tagIdList = tags.map((tag) => tag._id);
    queryString.questionTag = { $in: tagIdList };
  }

  if (title) {
    const { questions, totalPages } = await searchWithTitle(
      page,
      limit,
      title,
      queryString,
      projection
    );

    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
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
    .projection(projection)
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

    res.status(StatusCodes.OK).json({ question: _doc });
  } else {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
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
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  } else if (!answer) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
  } else if (userId != question.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  }

  //Checking whether this question have best answer or not
  let currentBestAnswer = question.bestAnswer || null;

  //Convert type Object Id to String
  if (currentBestAnswer) {
    currentBestAnswer = String(currentBestAnswer);
  }

  //Case already had best answer
  if (currentBestAnswer) {
    //Can't change best answer if this is bounty question
    if (question.questionBounty > 0) {
      throw new BadRequestError(
        "Can't change best answer of bountied question"
      );
    }

    //Undo best answer
    if (currentBestAnswer === req.params.answerId) {
      answer.bestAnswer = 0;
      question.bestAnswer = null;

      const result = await answer.save();
      await question.save();

      res.status(StatusCodes.OK).json({ Action: "Unvote best answer", result });
    }
    //Choose new best answer
    else {
      const oldBestAnswer = await AnswerModel.findById(currentBestAnswer);

      if (!oldBestAnswer) {
        throw new GoneError(ErrorMessage.ERROR_GONE);
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
    const answerOwner = answer.userId;
    let pointReward = Constants.bestAnswerAward;

    //Note this answer is best answer
    answer.bestAnswer = 1;
    const resultAnswer = await answer.save();

    //If this is bountied question, award bounty to answer owner
    if (question.questionBounty > 0 && question.bountyActive == 1) {
      //Noted that this bounty has been resolved
      question.bountyActive = 0;
      pointReward = question.questionBounty;
    }

    const transaction = await pointTransaction(answerOwner, pointReward);
    question.bestAnswer = answer._id;
    const resultQuestion = await question.save();

    if (resultAnswer && resultQuestion && transaction) {
      res
        .status(StatusCodes.OK)
        .json({ Action: "Choose best answer", resultAnswer });
    }
  }
};

const deleteQuestion = async (req: IUserRequest, res: Response) => {
  //Checking whether this user is owner of this post
  const { userId } = req.user!;
  const question = await Question.findById(req.params.questionId);

  if (!question) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  } else if (userId != question.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (question.questionStatus == 0) {
    throw new GoneError(ErrorMessage.ERROR_GONE);
  }

  //Set question status to 0 and decrease total question in tag by 1
  question.questionStatus = 0;
  question.questionTag.map(async (tag: string) => {
    let tags = await QuestionTagModel.updateOne(
      { _id: tag },
      { $inc: { totalQuestion: -1 } }
    );

    if (!tags) {
      throw new InternalServerError(ErrorMessage.ERROR_INVALID_TAG_ID);
    }
  });
  const result = await question.save();

  //Return result
  if (result) {
    res.status(StatusCodes.OK).json(result);
  } else {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

const updateQuestion = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const question = await Question.findOne({
    _id: req.params.questionId,
    questionStatus: 1,
  });

  if (!question) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  } else if (userId != question.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
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

const rebountyQuestion = async (req: IUserRequest, res: Response) => {
  //Checking whether this user is owner of this post
  const { userId } = req.user!;
  const question = await Question.findOne({
    _id: req.params.questionId,
    questionStatus: 1,
    bountyActive: 1,
  });

  if (!question) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
  } else if (userId != question.userId) {
    throw new ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
  } else if (question.questionBounty < 0) {
    throw new BadRequestError("This question cannot rebounty");
  }

  //Checking whether rebounty value is greater than old value
  const newBounty = req.body.newBounty;
  if (!newBounty) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  } else if (newBounty <= question.questionBounty) {
    throw new BadRequestError("New bounty value must greater than old value");
  } else if (
    newBounty < Constants.minBounty ||
    newBounty > Constants.maxBounty
  ) {
    throw new BadRequestError(
      `Bounty must in range ${Constants.minBounty} - ${Constants.maxBounty}`
    );
  }

  //Checking new bounty due date
  const newDueDate = new Date(req.body.newDueDate);
  if (!newDueDate) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  } else if (newDueDate <= question.bountyDueDate) {
    throw new BadRequestError("New due date must larger than old one");
  }

  var diff = Math.abs(newDueDate.getTime() - new Date().getTime());
  var diffDays = Math.ceil(diff / (1000 * 3600 * 24));

  if (
    diffDays < Constants.minBountyDueDate ||
    diffDays > Constants.maxBountyDueDate
  ) {
    throw new BadRequestError(
      `Due date at least ${Constants.minBountyDueDate} day(s) and maximum ${Constants.maxBountyDueDate} days from today`
    );
  }

  const awardDueDate = new Date(newDueDate.getTime());
  question.questionBounty = newBounty;
  question.bountyDueDate = newDueDate;
  question.awardDueDate = awardDueDate.setDate(awardDueDate.getDate() + 14);
  question.updateAt = new Date();

  const transaction = await pointTransaction(userId, newBounty * -1);
  if (!transaction) {
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  } else {
    const result = await question.save();
    if (result) {
      res.status(StatusCodes.OK).json(result);
    } else {
      throw new InternalServerError(ErrorMessage.ERROR_FAILED);
    }
  }
};

export {
  createQuestion,
  getQuestions,
  getQuestionByID,
  chooseBestAnswer,
  deleteQuestion,
  updateQuestion,
  rebountyQuestion,
};
