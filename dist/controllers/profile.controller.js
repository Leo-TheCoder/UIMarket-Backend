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
exports.updatePortfolio = exports.getPortfolio = exports.getProfileInfo = exports.updateProfile = exports.getProfileActivity = void 0;
const Question_model_1 = __importDefault(require("../models/Question.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const http_status_codes_1 = require("http-status-codes");
const unauthenticated_error_1 = __importDefault(require("../errors/unauthenticated-error"));
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const getProfileActivity = async (req, res) => {
    const { userId } = req.params;
    //Promise fetch questions of user
    const questionsPromise = Question_model_1.default.find({ userId }, { totalUpvote: 1, questionTitle: 1, totalDownvote: 1, questionBounty: 1 }).populate({
        path: "questionTag",
        select: "tagName",
    });
    //Promise fetch answers of user
    const answersPromise = Answer_model_1.default.find({ userId }, { totalUpvote: 1 }).populate({
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
    let tagStats = {};
    questions.map((question) => {
        //get sum of total upvote from questions
        totalUpvote += question.totalUpvote;
        //get number of upvote and post from every tag of question
        for (const tag of question.questionTag) {
            const tagStat = tagStats[tag.tagName]
                ? tagStats[tag.tagName]
                : {
                    _id: tag._id,
                    numOfPosts: 0,
                    upvote: 0,
                };
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
                : {
                    _id: tag._id,
                    numOfPosts: 0,
                    upvote: 0,
                };
            tagStat.numOfPosts++;
            tagStat.upvote += answer.totalUpvote;
            tagStats[tag.tagName] = tagStat;
        }
    });
    //Convert Object tagStats to array (more convenient for FE)
    const tagStatsArray = [];
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
    res.status(http_status_codes_1.StatusCodes.OK).json({
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
exports.getProfileActivity = getProfileActivity;
const getProfileInfo = async (req, res) => {
    const { userId } = req.params;
    const userDoc = await User_model_1.default.findById(userId, "-authenToken -customerPassword -createdAt -updatedAt -portfolio -refreshToken");
    if (!userDoc) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    const user = JSON.parse(JSON.stringify(userDoc._doc));
    if (!(req.user && req.user.userId === userId)) {
        delete user.customerStatus;
    }
    user.customerWallet.coin = undefined;
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: {
            ...user,
            customerWallet: {
                point: user.customerWallet.point,
            }
        } });
};
exports.getProfileInfo = getProfileInfo;
const updateProfile = async (req, res) => {
    const user = req.user;
    const { customerName, customerDOB, customerAvatar, customerPhone, customerBio, } = req.body;
    const updatedUser = await User_model_1.default.findByIdAndUpdate(user.userId, {
        customerName,
        customerDOB,
        customerAvatar,
        customerPhone,
        customerBio,
    }, {
        new: true,
    });
    if (!updatedUser) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_INVALID_USER_ID);
    }
    const doc = JSON.parse(JSON.stringify(updatedUser._doc));
    delete doc.customerPassword;
    delete doc.authenToken;
    const result = {
        updatedUser: doc,
    };
    res.status(http_status_codes_1.StatusCodes.OK).json(result);
};
exports.updateProfile = updateProfile;
const getPortfolio = async (req, res) => {
    const { userId } = req.params;
    const portfolio = await User_model_1.default.findById(userId).select("portfolio").lean();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        portfolio,
    });
};
exports.getPortfolio = getPortfolio;
const updatePortfolio = async (req, res) => {
    const { userId } = req.user;
    const portfolio = req.body.portfolio;
    const userDocument = await User_model_1.default.findById(userId).select("portfolio");
    userDocument.portfolio = portfolio;
    await userDocument.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        portfolio: userDocument.toObject(),
    });
};
exports.updatePortfolio = updatePortfolio;
//# sourceMappingURL=profile.controller.js.map