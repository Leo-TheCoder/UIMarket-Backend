import express from "express";
import {
  forgetPasswordEmail,
  googleLogin,
  login,
  loginWithToken,
  register,
  resetPassword,

} from "../controllers/auth.controller";
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/login", compulsoryAuth, loginWithToken);

//POST Method
router.post("/register", register);
router.post("/login", login);
router.post("/forgetPassword", forgetPasswordEmail);
router.post("/resetPassword", compulsoryAuth, resetPassword);
router.post("/login-google", googleLogin);

//PUT Method
//DELETE Method

export default router;
