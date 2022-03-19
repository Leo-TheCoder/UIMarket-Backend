import express from "express";
import {
  createQuestion,
  getQuestionByID,
  getQuestions,
} from "../controllers/question.controller";

import * as authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

//GET Methods
router.get("/", getQuestions);
router.get("/:id", authenticationMiddleware.optionalAuth, getQuestionByID);

//POST Methods
router.post("/", authenticationMiddleware.compulsoryAuth, createQuestion);

export default router;
