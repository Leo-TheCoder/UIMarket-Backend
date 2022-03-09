import express from "express";
import {
  createQuestion,
  getQuestions,
} from "../controllers/question.controller";
import authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

router.get("/", getQuestions);
router.post("/", authenticationMiddleware, createQuestion);

export default router;
