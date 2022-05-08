import express from "express";
import {
  resendVerifyEmail,
  resetForgetPassword,
  verifyEmailCode,
} from "../controllers/auth.controller";
const router = express.Router();

//GET Method
router.get("/", verifyEmailCode);
router.get("/resend", resendVerifyEmail);

//POST Method
router.post("/resetForgetPassword", resetForgetPassword);

//PUT Method
//DELETE Method

export default router;
