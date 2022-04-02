import express from "express";
import {
  compulsoryAuth,
  optionalAuth,
  shopCompulsoryAuth,
} from "../middlewares/authentication";
import {
  createShop,
  login,
  loginWithToken,
} from "../controllers/shop.controller";

const router = express.Router();

//POST Method
router.post("/register", compulsoryAuth, createShop);
router.post("/login", compulsoryAuth, login);

//GET Method
router.get("/login", shopCompulsoryAuth, loginWithToken);

export default router;
