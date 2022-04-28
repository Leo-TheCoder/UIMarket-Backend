import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  findByCategory,
  findById,
  findByName,
  getProductsByShop,
} from "../controllers/product.controller";

const router = express.Router();

//GET Method
router.get("/:productId", findById);
router.get("/category/:categoryId", findByCategory);
router.get("/search/:productName", findByName);
router.get("/shop/:shopId", getProductsByShop);

//POST Method
//PUT Method
//DELETE Method

export default router;
