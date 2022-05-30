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
exports.updateComment = exports.deleteComment = exports.getComments = exports.createComment = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const statusVote_1 = require("../utils/statusVote");
const Question_model_1 = __importDefault(require("../models/Question.model"));
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
const Constants = __importStar(require("../constants"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const createComment = async (req, res) => {
    const { userId } = req.user;
    //Checking whether questionId is valid
    const question = await Question_model_1.default.findById(req.body.questionId);
    if (!question) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    //Checking whether rootId is valid
    if (req.body.rootType === "Answer") {
        const answer = await Answer_model_1.default.find({
            _id: req.body.rootId,
            questionId: req.body.questionId,
        });
        if (!answer) {
            throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
        }
    }
    else if (req.body.rootId != req.body.questionId) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_ROOT_ID);
    }
    const comment = await Comment_model_1.default.create({
        ...req.body,
        userId,
    });
    //populate with user model
    await comment.populate("userId", "customerEmail customerName");
    res.status(http_status_codes_1.StatusCodes.CREATED).json(comment);
};
exports.createComment = createComment;
const getComments = async (req, res) => {
    const { rootId } = req.params;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimitComments;
    const queryString = {
        rootId,
        commentStatus: 1,
    };
    const total = await Comment_model_1.default.countDocuments(queryString);
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const comments = await Comment_model_1.default.find(queryString)
        .sort({ createdAt: +1 })
        .populate("userId", "customerName customerEmail")
        .skip((page - 1) * limit)
        .limit(limit);
    let result = comments;
    if (req.user) {
        result = [];
        for (const comment of comments) {
            const voteStatus = await (0, statusVote_1.getStatusVote)(req.user.userId, comment._id);
            result.push({
                ...comment._doc,
                voteStatus,
            });
        }
    }
    res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ comments: result, totalPages, limit, page });
};
exports.getComments = getComments;
const updateComment = async (req, res) => {
    const { userId } = req.user;
    const comment = await Comment_model_1.default.findOne({
        _id: req.params.commentId,
        commentStatus: 1,
    });
    //Validation
    if (!comment) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_COMMENT_ID);
    }
    else if (comment.userId != userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (!req.body.commentContent) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Update comment
    comment.commentContent = req.body.commentContent;
    comment.updateAt = new Date();
    const result = await comment.save();
    res.status(http_status_codes_1.StatusCodes.OK).json(result);
};
exports.updateComment = updateComment;
const deleteComment = async (req, res) => {
    const { userId } = req.user;
    const commemt = await Comment_model_1.default.findById(req.params.commentId);
    //Validation
    if (!commemt) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_COMMENT_ID);
    }
    else if (commemt.userId != userId) {
        throw new errors_1.ForbiddenError(ErrorMessage.ERROR_FORBIDDEN);
    }
    else if (commemt.commentStatus != 1) {
        throw new errors_1.GoneError(ErrorMessage.ERROR_GONE);
    }
    commemt.commentStatus = 0;
    commemt.updateAt = new Date();
    const result = await commemt.save();
    if (result) {
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    else {
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=comment.controller.js.map