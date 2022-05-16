import express from "express";
import {
  createOrder,
  preOrder,
  purchaseHistory,
} from "../controllers/invoice.controller";

const router = express.Router();

//GET
router.get("/history", purchaseHistory);

//POST Method
router.post("/", createOrder);
router.post("/preOrder", preOrder);

export default router;
