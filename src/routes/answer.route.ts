import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createAnswer,
  getAnswer,
  deleteAnswer,
  updateAnswer,
} from "../controllers/answer.controller";

const router = express.Router();

//GET Method
router.get("/:questionId", optionalAuth, getAnswer);

//POST Method
router.post("/:questionId", compulsoryAuth, createAnswer);

//PUT Method
router.put("/:answerId", compulsoryAuth, updateAnswer);

//DELETE Method
router.delete("/:answerId", compulsoryAuth, deleteAnswer);

export default router;
