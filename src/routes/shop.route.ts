import express from "express";
import {
  compulsoryAuth,
  optionalAuth,
  // shopCompulsoryAuth,
} from "../middlewares/authentication";
import {
  createShop,
  uploadProduct,
  // login,
  // loginWithToken,
} from "../controllers/shop.controller";

const router = express.Router();

//POST Method
router.post("/register", compulsoryAuth, createShop);
router.post("/product", compulsoryAuth, uploadProduct);
// router.post("/login", compulsoryAuth, login);

//GET Method
// router.get("/login", shopCompulsoryAuth, loginWithToken);

export default router;
