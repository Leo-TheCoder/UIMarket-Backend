import express from "express";
import { getTags } from "../controllers/questionTag.controller";
const router = express.Router();

//GET Method
router.get("/", getTags);

//POST Method
//PUT Method
//DELETE Method

export default router;
