import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createShop,
  uploadProduct,
  deleteProduct,
  updateProduct,
} from "../controllers/shop.controller";

const router = express.Router();

//GET Method

//POST Method
router.post("/register", compulsoryAuth, createShop);
router.post("/product", compulsoryAuth, uploadProduct);

//PUT Method
router.put("/product/:productId", compulsoryAuth, updateProduct);

//DELETE Method
router.delete("/product/:productId", compulsoryAuth, deleteProduct);

export default router;
