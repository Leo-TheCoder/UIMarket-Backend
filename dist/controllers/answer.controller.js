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
exports.updateAnswer = exports.deleteAnswer = exports.getAnswer = exports.createAnswer = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const mongodb_1 = require("mongodb");
const Constants = __importStar(require("../constants"));
const statusVote_1 = require("../utils/statusVote");
//Model
const Question_model_1 = __importDefault(require("../models/Question.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
//Error
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const createAnswer = async (req, res) => {
    const question = await Question_model_1.default.findById(req.params.questionId);
    if (question) {
        const { userId } = req.user;
        let answer = await Answer_model_1.default.create({
            ...req.body,
            userId: userId,
            questionId: req.params.questionId,
        });
        answer = await Answer_model_1.default.populate(answer, {
            path: "userId",
            select: ["customerName", "customerEmail", "customerAvatar"],
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json(answer);
    }
    else {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
};
exports.createAnswer = createAnswer;
const getAnswer = async (req, res) => {
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await Answer_model_1.default.countDocuments({
        questionId: req.params.questionId,
    });
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const answers = await Answer_model_1.default.aggregate([
        {
            $match: {
                answerStatus: 1,
                questionId: new mongodb_1.ObjectId(req.params.questionId),
            },
        },
        {
            $addFields: {
                balanceVote: {
                    $subtract: ["$totalUpvote", "$totalDownvote"],
                },
            },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $sort: { bestAnswer: -1, balanceVote: -1 } },
        {
            $lookup: {
                from: "customers",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            customerName: 1,
                            customerEmail: 1,
                            customerAvatar: 1,
                        },
                    },
                ],
                as: "customerInfo",
            },
        },
    ]);
    if (answers.length != 0) {
        for (let i = 0; i < answers.length; i++) {
            let voteStatus = {
                upvote: false,
                downvote: false,
            };
            if (req.user) {
                voteStatus = await (0, statusVote_1.getStatusVote)(req.user.userId, answers[i]._id);
            }
            answers[i].voteStatus = voteStatus;
        }
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        answers,
    });
};
exports.getAnswer = getAnswer;
const deleteAnswer = async (req, res) => {
    //Checking whether user is answer's owner
    const answer = await Answer_model_1.default.findById(req.params.answerId);
    const { userId } = req.user;
    if (!answer) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
    }
    else if (answer.userId != userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    //Checking answer status
    if (answer.answerStatus == 1) {
        //Update answer status
        answer.answerStatus = 0;
        answer.updateAt = new Date();
        const result = await answer.save();
        //Update total answer
        const question = await Question_model_1.default.findByIdAndUpdate(answer.questionId, {
            $inc: { totalAnswer: -1 },
        }, { new: true });
        //Return response
        if (result && question) {
            res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        else {
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    else {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
};
exports.deleteAnswer = deleteAnswer;
const updateAnswer = async (req, res) => {
    const { userId } = req.user;
    //Checking whether user is answer's owner
    const answer = await Answer_model_1.default.findOne({
        _id: req.params.answerId,
        answerStatus: 1,
    });
    if (!answer) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
    }
    else if (answer.userId != userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (!req.body.answerContent) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    if (answer.answerContent != req.body.answerContent) {
        answer.answerContent = req.body.answerContent;
        answer.updateAt = new Date();
        const result = await answer.save();
        if (result) {
            res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        else {
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    else {
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send("Nothing's changed");
    }
};
exports.updateAnswer = updateAnswer;
//# sourceMappingURL=answer.controller.js.map