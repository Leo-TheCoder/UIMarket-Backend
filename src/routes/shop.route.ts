import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createShop,
  updateShop,
  uploadProduct,
  deleteProduct,
  updateProduct,
  getAllProduct,
} from "../controllers/shop.controller";

const router = express.Router();

//GET Method
router.get("/product", getAllProduct);

//POST Method
router.post("/register", createShop);
router.post("/product", uploadProduct);

//PUT Method
router.put("/", updateShop);
router.put("/product/:productId", updateProduct);

//DELETE Method
router.delete("/product/:productId", deleteProduct);

export default router;
