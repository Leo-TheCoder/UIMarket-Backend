import express from "express";
import {
  forgetPasswordEmail,
  login,
  loginWithToken,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import * as authenticationMiddleware from "../middlewares/authentication";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/login", authenticationMiddleware.compulsoryAuth, loginWithToken);
router.get("/forgetPassword", forgetPasswordEmail);
router.post(
  "/resetPassword",
  authenticationMiddleware.compulsoryAuth,
  resetPassword
);

export default router;
