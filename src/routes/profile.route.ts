import express from "express";
import { optionalAuth, compulsoryAuth } from "../middlewares/authentication";
import {
  getProfileActivity,
  getProfileInfo,
  updateProfile,
} from "../controllers/profile.controller";

const router = express.Router();

//GET Method
router.get("/activity/:userId", optionalAuth, getProfileActivity);
router.get("/info/:userId", optionalAuth, getProfileInfo);

//POST Method
router.post("/info", compulsoryAuth, updateProfile);

//PUT Method
//DELETE Method

export default router;
