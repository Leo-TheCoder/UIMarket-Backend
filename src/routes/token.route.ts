import express from "express";
import { refreshAccessToken, revoke } from "../controllers/token.controller";
import { compulsoryAuth } from "../middlewares/authentication";
const router = express.Router();

//GET Method
router.get("/revoke", compulsoryAuth, revoke);

//POST Method
router.post("/refresh", refreshAccessToken);

//PUT Method
//DELETE Method

export default router;
