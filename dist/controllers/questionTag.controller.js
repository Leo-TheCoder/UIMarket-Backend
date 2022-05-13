"use strict";
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
exports.getTags = void 0;
const QuestionTag_model_1 = __importDefault(require("../models/QuestionTag.model"));
const http_status_codes_1 = require("http-status-codes");
const getTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const tagName = query.tagName || null;
    if (!tagName || (tagName === null || tagName === void 0 ? void 0 : tagName.length) < 1) {
        return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    const regexp = new RegExp("^" + tagName);
    const tagsDoc = yield QuestionTag_model_1.default.find({ tagName: regexp }, { '_id': 0, 'tagName': 1 }).limit(5);
    const tags = tagsDoc.map(tag => tag.tagName);
    res.status(http_status_codes_1.StatusCodes.OK).json(tags);
});
exports.getTags = getTags;
//# sourceMappingURL=questionTag.controller.js.map