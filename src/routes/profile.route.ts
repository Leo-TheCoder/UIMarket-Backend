import express from "express";
import { optionalAuth } from "../middlewares/authentication";
import { getProfileActivity } from "../controllers/profile.controller";
const router = express.Router();

//GET Method
router.get("/:userId", optionalAuth, getProfileActivity);

//POST Method
//PUT Method
//DELETE Method

export default router;
