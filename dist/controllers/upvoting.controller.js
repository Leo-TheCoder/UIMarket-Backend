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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upvote = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const Question_model_1 = __importDefault(require("../models/Question.model"));
const Voting_model_1 = __importDefault(require("../models/Voting.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const currencyTransaction_1 = require("../utils/currencyTransaction");
const Constants = __importStar(require("../constants"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const upvote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { type, questionId, objectId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    //Trigger solution
    const validType = ["Question", "Comment", "Answer"];
    if (!type) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    else if (!validType.includes(type)) {
        throw new errors_1.BadRequestError("Valid types are: Question, Answer, and Comment");
    }
    //Checking questionId is available or not
    const question = yield Question_model_1.default.findById(questionId);
    if (!question) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
    }
    //Checking objectId
    switch (type) {
        case "Question":
            if (questionId != objectId) {
                throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_QUESTION_ID);
            }
            break;
        case "Answer":
            const answer = yield Answer_model_1.default.find({
                _id: objectId,
                questionId: questionId,
                answerStatus: 1,
            });
            if (answer.length === 0) {
                throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_ANSWER_ID);
            }
            break;
        case "Comment":
            const comment = yield Comment_model_1.default.find({
                _id: objectId,
                questionId: questionId,
                commentStatus: 1,
            });
            if (comment.length === 0) {
                throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_COMMENT_ID);
            }
            break;
    }
    const result = yield upvoteObject(userId, questionId, objectId, type);
    return res.status(result.status).json(result.msg);
});
exports.upvote = upvote;
// const upvoteQuestion = async (
//   userId: string,
//   questionId: string,
//   objectId: string,
// ) => {
//   //get document of voting
//   const votingDoc = await VotingModel.findOne({
//     userId,
//     questionId,
//     objectId,
//   });
//   const question = await QuestionModel.findById(objectId, ["userId"]);
//   //if users are voting their posts
//   if (question.userId == userId) {
//     return {
//       msg: "CANNOT VOTE FOR YOUR OWN POSTS",
//       status: StatusCodes.BAD_REQUEST,
//     };
//   }
//   //if user didn't vote for that object before...
//   if (!votingDoc) {
//     //create new voting object
//     const newVotingDoc = await VotingModel.findOneAndUpdate(
//       { userId, questionId, objectId },
//       { action: 1 },
//       { new: true, upsert: true },
//     );
//     const totalUpvote = await VotingModel.countDocuments({
//       objectId,
//       action: 1,
//     });
//     //update question upvote number
//     await QuestionModel.findOneAndUpdate(
//       {
//         _id: questionId,
//       },
//       { totalUpvote },
//     );
//     return {
//       msg: "UPVOTED",
//       status: StatusCodes.OK,
//     };
//   }
//   //if user has voted for object...
//   else {
//     let msg = "";
//     if (votingDoc.action === 0) {
//       votingDoc.action = 1;
//       await votingDoc.save();
//       msg = "UPVOTED";
//     } else {
//       //removing voting object => unvote
//       await votingDoc.remove();
//       msg = "UNVOTED";
//     }
//     const totalUpvote = await VotingModel.countDocuments({
//       objectId,
//       action: 1,
//     });
//     const totalDownvote = await VotingModel.countDocuments({
//       objectId,
//       action: 0,
//     });
//     //update voting number
//     await QuestionModel.findOneAndUpdate(
//       { _id: questionId },
//       { totalUpvote, totalDownvote },
//     );
//     return {
//       msg,
//       status: StatusCodes.OK,
//     };
//   }
// };
const upvoteObject = (userId, questionId, objectId, type) => __awaiter(void 0, void 0, void 0, function* () {
    const votingDoc = yield Voting_model_1.default.findOne({
        userId,
        questionId,
        objectId,
        type,
    });
    if (!votingDoc) {
        yield Voting_model_1.default.create({
            userId,
            questionId,
            objectId,
            type,
            action: 1,
        }, (err, vote) => {
            if (err)
                return {
                    status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    msg: err,
                };
        });
        const transaction = yield (0, currencyTransaction_1.pointTransaction)(userId, Constants.upvoteAward, "Upvote for question");
        return {
            status: http_status_codes_1.StatusCodes.OK,
            msg: "UPVOTED",
        };
    }
    else {
        //if upvoted
        if (votingDoc.action === 1) {
            yield votingDoc.remove();
            const transaction = yield (0, currencyTransaction_1.pointTransaction)(userId, Constants.upvoteAward * -1, "Unvote for question");
            return {
                status: http_status_codes_1.StatusCodes.OK,
                msg: "UNVOTED",
            };
        }
        //if downvoted
        else {
            yield votingDoc.remove();
            yield Voting_model_1.default.create({
                userId,
                questionId,
                objectId,
                type,
                action: 1,
            }, (err, vote) => {
                if (err)
                    return {
                        status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                        msg: err,
                    };
            });
            return {
                status: http_status_codes_1.StatusCodes.OK,
                msg: "UPVOTED",
            };
        }
    }
});
//# sourceMappingURL=upvoting.controller.js.map