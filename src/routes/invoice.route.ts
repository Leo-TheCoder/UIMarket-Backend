import express from "express";
import {
  createOrder,
  getShopTransaction,
  preOrder,
  purchaseHistory,
  searchPurchaseHistory,
} from "../controllers/invoice.controller";

const router = express.Router();

//GET
router.get("/history", purchaseHistory);
router.get("/history/:productName", searchPurchaseHistory);
router.get("/transaction", getShopTransaction);

//POST Method
router.post("/", createOrder);
router.post("/preOrder", preOrder);

export default router;
