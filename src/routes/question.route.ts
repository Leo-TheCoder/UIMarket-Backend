import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createQuestion,
  getQuestionByID,
  getQuestions,
  chooseBestAnswer,
  deleteQuestion,
  updateQuestion,
  rebountyQuestion,
} from "../controllers/question.controller";

const router = express.Router();

//GET Methods
router.get("/", getQuestions);
router.get("/:id", optionalAuth, getQuestionByID);

//POST Methods
router.post("/", compulsoryAuth, createQuestion);

//PUT Methods
router.put("/rebounty/:questionId/", compulsoryAuth, rebountyQuestion);
router.put("/:questionId", compulsoryAuth, updateQuestion);
router.put("/:questionId/:answerId", compulsoryAuth, chooseBestAnswer);

//DELETE Methods
router.delete("/:questionId", compulsoryAuth, deleteQuestion);

export default router;
