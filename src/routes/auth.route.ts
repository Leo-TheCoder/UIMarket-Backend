import express from "express";
import {
  login,
  loginWithToken,
  register,
} from "../controllers/auth.controller";
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/login", compulsoryAuth, loginWithToken);

//POST Method
router.post("/register", register);
router.post("/login", login);

//PUT Method

//DELETE Method

export default router;
