import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createQuestion,
  getQuestionByID,
  getQuestions,
  chooseBestAnswer,
  deleteQuestion,
  updateQuestion,
} from "../controllers/question.controller";

const router = express.Router();

//GET Methods
router.get("/", getQuestions);
router.get("/:id", optionalAuth, getQuestionByID);

//POST Methods
router.post("/", compulsoryAuth, createQuestion);

//PUT Methods
router.put("/:questionId/:answerId", compulsoryAuth, chooseBestAnswer);
router.put("/:questionId", compulsoryAuth, updateQuestion);

//DELETE Methods
router.delete("/:questionId", compulsoryAuth, deleteQuestion);

export default router;
