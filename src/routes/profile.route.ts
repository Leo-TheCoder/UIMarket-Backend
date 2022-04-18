import express from "express";
import { optionalAuth } from "../middlewares/authentication";
import {
  getProfileActivity,
  getProfileInfo,
  updateProfile,
} from "../controllers/profile.controller";

const router = express.Router();

//GET Method
router.get("/:userId", optionalAuth, getProfileActivity);
router.get("/info/:userId", optionalAuth, getProfileInfo);

//POST Method
router.post("/info", authenticationMiddleware.compulsoryAuth, updateProfile);

//PUT Method
//DELETE Method

export default router;
