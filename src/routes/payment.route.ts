import express from "express";
import {
  createOrder,
  captureOrder,
  cancelPayment,
  payoutOrder,
  returnAfterLoginPaypal,
  authorizationEndpoint,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/create-order", createOrder);
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.post("/payout", payoutOrder);
router.get("/after-login", returnAfterLoginPaypal);
router.get("/authorization-endpoint", authorizationEndpoint)

export default router;
