import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import { createReview } from "../controllers/review.controller";

const router = express.Router();

//GET Method

//POST Method/
router.post("/:invoiceId", createReview);
//PUT Method

//DELETE Method

export default router;
