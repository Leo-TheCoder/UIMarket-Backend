import express from "express";
import {
  resendVerifyEmail,
  resetForgetPassword,
  verifyEmailCode,
} from "../controllers/auth.controller";
const router = express.Router();

router.get("/", verifyEmailCode);
router.get("/resend", resendVerifyEmail);
router.post("/resetForgetPassword", resetForgetPassword);

export default router;
