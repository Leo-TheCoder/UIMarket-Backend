import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
} from "../controllers/review.controller";

const router = express.Router();

//GET Method
router.get("/:productId", getProductReviews);
router.get("/detail/:reviewId", getReviewById);

//POST Method/
router.post("/:invoiceId/:productId", compulsoryAuth, createReview);

//PUT Method
router.put("/:reviewId", compulsoryAuth, updateReview);

//DELETE Method

export default router;
