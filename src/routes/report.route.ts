import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import { createReport } from "../controllers/report.controller";

const router = express.Router();

//GET Method

//POST Method
router.post("/", createReport);

//PUT Method

//DELETE Method

export default router;
