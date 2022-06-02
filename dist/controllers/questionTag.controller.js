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
        return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    const regexp = new RegExp("^" + tagName);
    const tagsDoc = await QuestionTag_model_1.default.find({ tagName: regexp }, { '_id': 0, 'tagName': 1 }).limit(5);
    const tags = tagsDoc.map(tag => tag.tagName);
    res.status(http_status_codes_1.StatusCodes.OK).json(tags);
};
exports.getTags = getTags;
//# sourceMappingURL=questionTag.controller.js.map