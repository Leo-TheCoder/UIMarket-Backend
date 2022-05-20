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
  deactiveProduct,
  activeProduct,
  getProductStatistic,
  paymentHistory,
  getProductsByName,
} from "../controllers/shop.controller";

const router = express.Router();

//GET Method
router.get("/product", compulsoryAuth, getAllProduct);
router.get("/product/statistic", compulsoryAuth, getProductStatistic);
router.get("/info/:shopId", optionalAuth, getShopById);
router.get("/search/:shopName", getShopByName);
router.get("/payment/history", compulsoryAuth, paymentHistory);
router.get("/product/search/:productName", compulsoryAuth, getProductsByName);

//POST Method/
router.post("/register", compulsoryAuth, createShop);
router.post("/product", compulsoryAuth, uploadProduct);

//PUT Method
router.put("/", compulsoryAuth, updateShop);
router.put("/product/:productId", compulsoryAuth, updateProduct);
router.put("/product/deactive/:productId", compulsoryAuth, deactiveProduct);
router.put("/product/active/:productId", compulsoryAuth, activeProduct);

//DELETE Method
router.delete("/product/:productId", compulsoryAuth, deleteProduct);

export default router;
