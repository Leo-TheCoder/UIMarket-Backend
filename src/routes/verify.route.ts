import express from "express";
import { resendVerifyEmail, verifyEmailCode } from "../controllers/auth.controller";
const router = express.Router();

router.get("/", verifyEmailCode);
router.get("/resend", resendVerifyEmail);

export default router;