import express from "express";
import {
  createQuestion,
  getQuestionByID,
  getQuestions,
} from "../controllers/question.controller";
import authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

//GET Methods
router.get("/", getQuestions);
router.get("/:id", getQuestionByID);

//POST Methods
router.post("/", authenticationMiddleware, createQuestion);

export default router;
