import express from "express";
import * as authenticationMiddleware from "../middlewares/authentication";
import {
  getProfileActivity,
  getProfileInfo,
  updateProfile,
} from "../controllers/profile.controller";
const router = express.Router();

//GET Method
router.get(
  "/activity/:userId",
  authenticationMiddleware.optionalAuth,
  getProfileActivity
);

router.get(
  "/info/:userId",
  authenticationMiddleware.optionalAuth,
  getProfileInfo
);
router.post("/info", authenticationMiddleware.compulsoryAuth, updateProfile);

export default router;
