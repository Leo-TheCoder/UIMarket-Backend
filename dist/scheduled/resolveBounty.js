"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBounty = void 0;
const currencyTransaction_1 = require("../utils/currencyTransaction");
const mongodb_1 = require("mongodb");
//Model
const Question_model_1 = __importDefault(require("../models/Question.model"));
const Answer_model_1 = __importDefault(require("../models/Answer.model"));
const resolveBounty = async () => {
    console.log("Resolve bounty is running");
    //Get list of question need to be resolved
    const questions = await Question_model_1.default.find({
        bountyActive: 1,
        awardDueDate: { $lt: new Date() },
    });
    for (let i = 0; i < questions.length; i++) {
        //Get the answer with most upvote
        var answer = await Answer_model_1.default.aggregate([
            {
                $match: {
                    answerStatus: 1,
                    questionId: new mongodb_1.ObjectId(questions[i]._id),
                    userId: { $not: { $eq: new mongodb_1.ObjectId(questions[i].userId) } },
                },
            },
            {
                $addFields: {
                    balanceVote: {
                        $subtract: ["$totalUpvote", "$totalDownvote"],
                    },
                },
            },
            { $limit: 1 },
            { $sort: { balanceVote: -1 } },
        ]);
        //Award to this answer ownwer
        if (answer.length > 0) {
            var award = questions[i].questionBounty / 2;
            await (0, currencyTransaction_1.pointTransaction)(answer[0].userId, award, "Awarded bounty question");
        }
        questions[i].bountyActive = 0;
        await questions[i].save();
    }
};
exports.resolveBounty = resolveBounty;
(0, exports.resolveBounty)();
//# sourceMappingURL=resolveBounty.js.map