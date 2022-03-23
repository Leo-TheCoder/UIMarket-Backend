import express from "express";
import { createComment, getComments } from "../controllers/comment.controller";
import * as authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/:answerId", authenticationMiddleware.optionalAuth, getComments);

//POST Method
router.post(
  "/:answerId",
  authenticationMiddleware.compulsoryAuth,
  createComment,
);

export default router;
