//Library
import * as Constants from "../constants";
import { pointRollBack, pointTransaction } from "../utils/currencyTransaction";
import { ObjectId } from "mongodb";

//Model
import QuestionModel from "../models/Question.model";
import AnswerModel from "../models/Answer.model";

//Error
import * as ErrorMessage from "../errors/error_message";
import {} from "../errors";

export const resolveBounty = async () => {
  console.log("Resolve bounty is running");

  //Get list of question need to be resolved
  const questions = await QuestionModel.find({
    bountyActive: 1,
    awardDueDate: { $lt: new Date() },
  });

  for (let i = 0; i < questions.length; i++) {
    //Get the answer with most upvote
    var answer = await AnswerModel.aggregate([
      {
        $match: {
          answerStatus: 1,
          questionId: new ObjectId(questions[i]._id),
          userId: { $not: { $eq: new ObjectId(questions[i].userId) } },
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
      await pointTransaction(
        answer[0].userId,
        award,
        "Awarded bounty question",
      );
    }
    questions[i].bountyActive = 0;
    await questions[i].save();
  }
};

resolveBounty();