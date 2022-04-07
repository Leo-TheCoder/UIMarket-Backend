import express from "express";
import { verifyEmailCode } from "../controllers/auth.controller";
const router = express.Router();

router.get("/", verifyEmailCode);

export default router;