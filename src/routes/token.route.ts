import express from "express";
import { refreshAccessToken, revoke } from "../controllers/token.controller";
import {compulsoryAuth} from "../middlewares/authentication";
const router = express.Router();

router.post("/refresh", refreshAccessToken);
router.get("/revoke", compulsoryAuth, revoke);

export default router;