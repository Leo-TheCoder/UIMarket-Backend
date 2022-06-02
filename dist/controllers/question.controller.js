"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebountyQuestion = exports.updateQuestion = exports.deleteQuestion = exports.chooseBestAnswer = exports.getQuestionByID = exports.getQuestions = exports.createQuestion = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
const statusVote_1 = require("../utils/statusVote");
const currencyTransaction_1 = require("../utils/currencyTransaction");
//Model
const Question_model_1 = __importDefault(require("../models/Question.model"));
const QuestionTag_model_1 = __importDefault(require("../models/QuestionTag.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
//get _id of tags in list (create tags if they don't exist)
const createTagList = async (tagList) => {
    const promises = [];
    for (const tag of tagList) {
        promises.push(QuestionTag_model_1.default.findOneAndUpdate({ tagName: tag }, { $inc: { totalQuestion: +1 } }, { new: true, upsert: true }));
    }
    const tagObjects = await Promise.all(promises);
    return tagObjects.map((obj) => obj._id);
};
//create question endpoint
const createQuestion = async (req, res) => {
    const { userId } = req.user;
    //get array of tags' list
    const tagList = req.body.questionTag;
    let list = [];
    if (!tagList || tagList.length < 1) {
        list = [];
    }
    else {
        list = await createTagList(tagList);
    }
    //Case bounty question
    if (req.body.questionBounty && req.body.questionBounty > 0) {
        //Check bounty value
        if (req.body.questionBounty < Constants.minBounty ||
            req.body.questionBounty > Constants.maxBounty) {
            throw new errors_1.BadRequestError(`Bounty must in range ${Constants.minBounty} - ${Constants.maxBounty}`);
        }
        //Check bounty due date
        if (!req.body.bountyDueDate) {
            throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
        }
        const dueDate = new Date(req.body.bountyDueDate);
        //Checking valid due date
        let diff = Math.abs(dueDate.getTime() - new Date().getTime());
        let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        if (diffDays < Constants.minBountyDueDate ||
            diffDays > Constants.maxBountyDueDate) {
            throw new errors_1.BadRequestError(` Due date at least ${Constants.minBountyDueDate} day(s) and maximum ${Constants.maxBountyDueDate} days`);
        }
        const awardDueDate = new Date(dueDate.getTime());
        //Checking valid balance
        const changeAmount = req.body.questionBounty * -1;
        const transaction = await (0, currencyTransaction_1.pointTransaction)(userId, changeAmount, "Create bounty question");
        if (transaction) {
            req.body.bountyActive = 1;
        }
        //Create question
        const question = await Question_model_1.default.create({
            ...req.body,
            userId: userId,
            questionTag: list,
            awardDueDate: awardDueDate.setDate(awardDueDate.getDate() + 14),
        });
        if (!question && req.body.bountyActive != 1) {
            await (0, currencyTransaction_1.pointRollBack)(userId, transaction._id, changeAmount);
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
        else {
            res.status(http_status_codes_1.StatusCodes.CREATED).json(question);
        }
    }
    else {
        //Normal question
        const question = await Question_model_1.default.create({
            ...req.body,
            userId: userId,
            questionTag: list,
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json(question);
    }
};
exports.createQuestion = createQuestion;
const searchWithTitle = async (page, limit, title, queryString, projection) => {
    const selectOption = projection;
    const totalQuestion = await Question_model_1.default.aggregate([
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
    if (totalQuestion.length < 1) {
        return {
            questions: [],
            totalPages: 0,
        };
    }
    const total = totalQuestion[0].total;
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const questions = await Question_model_1.default.aggregate([
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
    await Question_model_1.default.populate(questions, {
        path: "questionTag",
        select: { tagName: 1 },
    });
    await Question_model_1.default.populate(questions, {
        path: "userId",
        select: { customerName: 1 },
    });
    return {
        questions,
        totalPages,
    };
};
const getQuestions = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const tag = query.tag;
    const selectWith = query.selectWith?.toLowerCase().trim() || "all";
    const title = query.title;
    //Handle with Query Parameters
    let queryString = { questionStatus: 1 };
    let projection = { questionContent: 0, __v: 0 };
    //Checking selectWith option
    if (selectWith === "bounty") {
        queryString.questionBounty = { $gt: 0 };
    }
    else if (selectWith === "popular") {
        queryString.questionBounty = { $lte: 0 };
    }
    if (tag) {
        const tagList = tag.split(",");
        const tags = await QuestionTag_model_1.default.find({ tagName: { $in: tagList } });
        const tagIdList = tags.map((tag) => tag._id);
        queryString.questionTag = { $in: tagIdList };
    }
    if (title) {
        const { questions, totalPages } = await searchWithTitle(page, limit, title, queryString, projection);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            totalPages,
            page,
            limit,
            questions,
        });
    }
    const total = await Question_model_1.default.countDocuments(queryString);
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const questions = await Question_model_1.default.find(queryString, projection)
        .sort({ questionBounty: -1, totalView: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("questionTag", "tagName")
        .populate("userId", "customerName")
        .lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        questions,
    });
};
exports.getQuestions = getQuestions;
const getQuestionByID = async (req, res) => {
    //Voting Status of user for this question
    let voteStatus = {
        upvote: false,
        downvote: false,
    };
    //Checking logged in user whether voted for this question
    if (req.user) {
        voteStatus = await (0, statusVote_1.getStatusVote)(req.user.userId, req.params.id);
    }
    //Find the question and increase its view by 1
    let question = await Question_model_1.default
        //
        .findByIdAndUpdate(req.params.id, { $inc: { totalView: 1 } })
        .populate("questionTag", "tagName")
        .populate({ path: "userId", select: ["customerName", "customerEmail"] });
    //Checking whether there was a question or not
    if (question) {
        const { _doc } = question;
        _doc.voteStatus = voteStatus;
        res.status(http_status_codes_1.StatusCodes.OK).json({ question: _doc });
    }
    else {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
};
exports.getQuestionByID = getQuestionByID;
const chooseBestAnswer = async (req, res) => {
    //Checking whether this user is owner of this post
    const { userId } = req.user;
    const question = await Question_model_1.default.findOne({
        _id: req.params.questionId,
        questionStatus: 1,
    });
    const answer = await Answer_model_1.default.findOne({
        _id: req.params.answerId,
        questionId: req.params.questionId,
        answerStatus: 1,
    });
    if (!question) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    else if (!answer) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
    }
    else if (userId != question.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
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
            throw new errors_1.BadRequestError("Can't change best answer of bountied question");
        }
        //Undo best answer
        if (currentBestAnswer === req.params.answerId) {
            answer.bestAnswer = 0;
            question.bestAnswer = null;
            const result = await answer.save();
            await question.save();
            res.status(http_status_codes_1.StatusCodes.OK).json({ Action: "Unvote best answer", result });
        }
        //Choose new best answer
        else {
            const oldBestAnswer = await Answer_model_1.default.findById(currentBestAnswer);
            if (!oldBestAnswer) {
                throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
            }
            oldBestAnswer.bestAnswer = 0;
            question.bestAnswer = answer._id;
            answer.bestAnswer = 1;
            await oldBestAnswer.save();
            await question.save();
            const result = await answer.save();
            res
                .status(http_status_codes_1.StatusCodes.OK)
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
        const transaction = await (0, currencyTransaction_1.pointTransaction)(answerOwner, pointReward, "Best answer for question");
        question.bestAnswer = answer._id;
        const resultQuestion = await question.save();
        if (resultAnswer && resultQuestion && transaction) {
            res
                .status(http_status_codes_1.StatusCodes.OK)
                .json({ Action: "Choose best answer", resultAnswer });
        }
    }
};
exports.chooseBestAnswer = chooseBestAnswer;
const deleteQuestion = async (req, res) => {
    //Checking whether this user is owner of this post
    const { userId } = req.user;
    const question = await Question_model_1.default.findById(req.params.questionId);
    if (!question) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    else if (userId != question.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (question.questionStatus == 0) {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
    //Set question status to 0 and decrease total question in tag by 1
    question.questionStatus = 0;
    question.questionTag.map(async (tag) => {
        let tags = await QuestionTag_model_1.default.updateOne({ _id: tag }, { $inc: { totalQuestion: -1 } });
        if (!tags) {
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_INVALID_TAG_ID);
        }
    });
    const result = await question.save();
    //Return result
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.deleteQuestion = deleteQuestion;
const updateQuestion = async (req, res) => {
    const { userId } = req.user;
    const question = await Question_model_1.default.findOne({
        _id: req.params.questionId,
        questionStatus: 1,
    });
    if (!question) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    else if (userId != question.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    const questionTitle = req.body.questionTitle || question.questionTitle;
    const questionContent = req.body.questionContent || question.questionContent;
    const questionBounty = req.body.questionBounty || question.questionBounty;
    if (questionTitle === question.questionTitle &&
        questionContent === question.questionContent &&
        questionBounty === question.questionBounty) {
        res.status(http_status_codes_1.StatusCodes.OK).send("Nothing updated");
    }
    else {
        question.updateAt = new Date();
        question.questionTitle = questionTitle;
        question.questionContent = questionContent;
        question.questionBounty = questionBounty;
        const result = await question.save();
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
};
exports.updateQuestion = updateQuestion;
const rebountyQuestion = async (req, res) => {
    //Checking whether this user is owner of this post
    const { userId } = req.user;
    const question = await Question_model_1.default.findOne({
        _id: req.params.questionId,
        questionStatus: 1,
        bountyActive: 1,
    });
    if (!question) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    else if (userId != question.userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (question.questionBounty < 0) {
        throw new errors_1.BadRequestError("This question cannot rebounty");
    }
    //Checking whether rebounty value is greater than old value
    const newBounty = req.body.newBounty;
    if (!newBounty) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    else if (newBounty <= question.questionBounty) {
        throw new errors_1.BadRequestError("New bounty value must greater than old value");
    }
    else if (newBounty < Constants.minBounty ||
        newBounty > Constants.maxBounty) {
        throw new errors_1.BadRequestError(`Bounty must in range ${Constants.minBounty} - ${Constants.maxBounty}`);
    }
    //Checking new bounty due date
    const newDueDate = new Date(req.body.newDueDate);
    if (!newDueDate) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    else if (newDueDate <= question.bountyDueDate) {
        throw new errors_1.BadRequestError("New due date must larger than old one");
    }
    let diff = Math.abs(newDueDate.getTime() - new Date().getTime());
    let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    if (diffDays < Constants.minBountyDueDate ||
        diffDays > Constants.maxBountyDueDate) {
        throw new errors_1.BadRequestError(`Due date at least ${Constants.minBountyDueDate} day(s) and maximum ${Constants.maxBountyDueDate} days from today`);
    }
    const awardDueDate = new Date(newDueDate.getTime());
    question.questionBounty = newBounty;
    question.bountyDueDate = newDueDate;
    question.awardDueDate = awardDueDate.setDate(awardDueDate.getDate() + 14);
    question.updateAt = new Date();
    const transaction = await (0, currencyTransaction_1.pointTransaction)(userId, newBounty * -1, "Rebounty for question");
    if (!transaction) {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
    else {
        const result = await question.save();
        if (result) {
            res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        else {
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
};
exports.rebountyQuestion = rebountyQuestion;
//# sourceMappingURL=question.controller.js.map