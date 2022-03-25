import express from "express";
import {
  createQuestion,
  getQuestionByID,
  getQuestions,
  chooseBestAnswer,
} from "../controllers/question.controller";

import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Methods
router.get("/", getQuestions);
router.get("/:id", optionalAuth, getQuestionByID);

//POST Methods
router.post("/", compulsoryAuth, createQuestion);

//PUT Methods
router.put("/:questionId/:answerId", compulsoryAuth, chooseBestAnswer);

export default router;
