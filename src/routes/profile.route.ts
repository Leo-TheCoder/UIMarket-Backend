import express from "express";
import * as authenticationMiddleware from "../middlewares/authentication";
import { getProfileActivity } from "../controllers/profile.controller";
const router = express.Router();

//GET Method
router.get("/:userId", authenticationMiddleware.optionalAuth, getProfileActivity);

export default router;
