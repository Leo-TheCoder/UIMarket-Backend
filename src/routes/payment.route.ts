import express from "express";
import {
  createOrder,
  captureOrder,
  cancelPayment,
  payoutOrder,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/create-order", createOrder);
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.post("/payout", payoutOrder);

export default router;
