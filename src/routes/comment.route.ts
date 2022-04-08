import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createComment,
  getComments,
  deleteComment,
  updateComment,
} from "../controllers/comment.controller";

const router = express.Router();

//GET Method
router.get("/:rootId", optionalAuth, getComments);

//POST Method
router.post("/", compulsoryAuth, createComment);

//PUT Method
router.put("/:commentId", compulsoryAuth, updateComment);

//DELETE Method
router.delete("/:commentId", compulsoryAuth, deleteComment);

export default router;
