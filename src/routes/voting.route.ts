import express from "express";
import {upvote} from "../controllers/upvoting.controller";
import { downvote } from "../controllers/downvoting.controller";
import authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

router.post("/upvote", upvote);
router.post("/downvote", downvote);

export default router;
