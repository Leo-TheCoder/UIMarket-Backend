import express from "express";
import * as authenticationMiddleware from "../middlewares/authentication";
import {
  getProfileActivity,
  updateProfile,
} from "../controllers/profile.controller";
const router = express.Router();

//GET Method
router.get(
  "/:userId",
  authenticationMiddleware.optionalAuth,
  getProfileActivity
);
router.post("/", authenticationMiddleware.compulsoryAuth, updateProfile);

export default router;
