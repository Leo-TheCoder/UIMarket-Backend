import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError } from '../errors';
import { Request, Response } from 'express';
import { IUserRequest } from '../types/express';
import Question from '../models/Question.model';
import QuestionTag from '../models/QuestionTag.model';
import { ObjectId } from 'mongodb';
import VotingModel from '../models/Voting.model';
import { downvote } from './downvoting.controller';
import { upvote } from './upvoting.controller';

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
	const list = await createTagList(tagList);

	const question = await Question.create({
		...req.body,
		userId: userId,
		questionTag: list,
	});
	res.status(StatusCodes.CREATED).json(question);
};

interface IQuery {
	page?: string;
	limit?: string;
	selectWith?: string;
}

const getQuestions = async (req: Request, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || 1;
  const limit = parseInt(query.limit!) || 10;

  const selectWith = query.selectWith?.toLowerCase().trim() || "all";

  //Get bounty question
  if (selectWith === "bounty") {
    const total = await Question.countDocuments({ questionBounty: { $gt: 0 } });
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({ questionBounty: { $gt: 0 } })
      .sort({ questionBounty: -1, totalView: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate("userId", "customerName");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  }

  //Get popular question
  else if (selectWith === "popular") {
    const total = await Question.countDocuments({
      questionBounty: { $lte: 0 },
    });
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find({ questionBounty: { $lte: 0 } })
      .sort({ totalComment: -1, totalUpvote: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate("userId", "customerName");
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  }
  //Get all question
  else {
    const total = await Question.countDocuments();
    const totalPages =
      total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;

    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionTag", "tagName")
      .populate({ path: "userId", select: ["customerName", "customerEmail"] });
    return res.status(StatusCodes.OK).json({
      totalPages,
      page,
      limit,
      questions,
    });
  }
};

const getQuestionByID = async (req: IUserRequest, res: Response) => {
	var voteStatus = {
		upvote: false,
		downvote: false,
	};

	if (req.user) {
		const o_questionID = new ObjectId(req.params.id);
		const o_userID = new ObjectId(req.user.userId);

		var vote = await VotingModel.find({
			objectId: o_questionID,
			userId: o_userID,
		}).select({
			_id: 0,
			action: 1,
		});

		if (vote.length != 0) {
			if (vote[0] === 0) {
				voteStatus.downvote = true;
			} else {
				voteStatus.upvote = true;
			}
		} 
	}

	var question = await Question
		// .findById(req.params.id)
		.findByIdAndUpdate(req.params.id, { $inc: { totalView: 1 } })
		.populate('questionTag', 'tagName')
		.populate({ path: 'userId', select: [ 'customerName', 'customerEmail' ] });

  // question.upvote = voteStatus.upvote;
  // question[0].downvote = voteStatus.downvote;
	// question.push(voteStatus);

	res.status(StatusCodes.OK).json({ question, voteStatus });
};

export {
	createQuestion,
	getQuestions,
	getQuestionByID,
};
