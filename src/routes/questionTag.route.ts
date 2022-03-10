import express from "express";
import {getTags} from "../controllers/questionTag.controller";
const router = express.Router();

router.get("/", getTags);

export default router;
