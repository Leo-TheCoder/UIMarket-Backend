import QuestionTagModel from "../models/QuestionTag.model";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

interface IQuery {
    tagName?: string
}

const getTags = async (req: Request, res: Response) => {
    const query = req.query as IQuery;
    const tagName = query.tagName || null;

    if(!tagName || tagName?.length < 1) {
        return res.status(StatusCodes.NO_CONTENT).send();
    }

    const regexp = new RegExp("^" + tagName);
    const tagsDoc = await QuestionTagModel.find({tagName: regexp}, {'_id': 0, 'tagName': 1}).limit(5);

    const tags = tagsDoc.map(tag => tag.tagName);
    res.status(StatusCodes.OK).json(tags);
}

export {getTags}