import express from "express";
import {
  login,
  loginWithToken,
  register,
} from "../controllers/auth.controller";
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/login", compulsoryAuth, loginWithToken);

export default router;
