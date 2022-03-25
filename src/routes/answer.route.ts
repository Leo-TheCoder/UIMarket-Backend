import express from "express";
import { createAnswer, getAnswer } from "../controllers/answer.controller";
import * as authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/:questionId", authenticationMiddleware.optionalAuth, getAnswer);

//POST Method
router.post(
  "/:questionId",
  authenticationMiddleware.compulsoryAuth,
  createAnswer,
);

export default router;
