import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  createShop,
  updateShop,
  uploadProduct,
  deleteProduct,
  updateProduct,
  getAllProduct,
  getShopById,
  getShopByName,
} from "../controllers/shop.controller";

const router = express.Router();

//GET Method
router.get("/:shopId", optionalAuth, getShopById);
router.get("/product", compulsoryAuth, getAllProduct);
router.get("/search/:shopName", getShopByName);

//POST Method/
router.post("/register", compulsoryAuth, createShop);
router.post("/product", compulsoryAuth, uploadProduct);

//PUT Method
router.put("/", compulsoryAuth, updateShop);
router.put("/product/:productId", compulsoryAuth, updateProduct);

//DELETE Method
router.delete("/product/:productId", compulsoryAuth, deleteProduct);

export default router;
