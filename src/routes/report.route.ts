import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createReport,
  reportListEC,
  reportListEdu,
} from "../controllers/report.controller";

const router = express.Router();

//GET Method
router.get("/reportList/Edu", reportListEdu);
router.get("/reportList/EC", reportListEC);

//POST Method
router.post("/", createReport);

//PUT Method

//DELETE Method

export default router;
