"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = void 0;
const QuestionTag_model_1 = __importDefault(require("../models/QuestionTag.model"));
const http_status_codes_1 = require("http-status-codes");
const getTags = async (req, res) => {
    const query = req.query;
    const tagName = query.tagName || null;
    if (!tagName || tagName?.length < 1) {
        //return res.status(StatusCodes.NO_CONTENT).send();
        const tags = await QuestionTag_model_1.default.find()
            .select("_id tagName totalQuestion")
            .lean();
        return res.status(http_status_codes_1.StatusCodes.OK).json(tags);
    }
    const regexp = new RegExp("^" + tagName);
    const tagsDoc = await QuestionTag_model_1.default.find({ tagName: regexp }, { _id: 1, tagName: 1, totalQuestion: 1 }).lean();
    res.status(http_status_codes_1.StatusCodes.OK).json(tagsDoc);
};
exports.getTags = getTags;
//# sourceMappingURL=questionTag.controller.js.map