import express from "express";
import { optionalAuth, compulsoryAuth } from "../middlewares/authentication";
import {
  getPortfolio,
  getProfileActivity,
  getProfileInfo,
  updatePortfolio,
  updateProfile,
} from "../controllers/profile.controller";

const router = express.Router();

//GET Method
router.get("/activity/:userId", optionalAuth, getProfileActivity);
router.get("/info/:userId", optionalAuth, getProfileInfo);
router.get("/portfolio/:userId", optionalAuth, getPortfolio);

//POST Method
router.post("/info", compulsoryAuth, updateProfile);
router.post("/portfolio", compulsoryAuth, updatePortfolio);

//PUT Method
//DELETE Method

export default router;
