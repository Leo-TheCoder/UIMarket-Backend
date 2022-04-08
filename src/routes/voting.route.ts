import express from "express";
import { upvote } from "../controllers/upvoting.controller";
import { downvote } from "../controllers/downvoting.controller";

const router = express.Router();

//GET Method

//POST Method
router.post("/upvote", upvote);
router.post("/downvote", downvote);

//PUT Method
//DELETE Method

export default router;
