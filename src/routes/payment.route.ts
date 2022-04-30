import express from "express";
import {
  createOrder,
  captureOrder,
  cancelPayment,
  payoutOrder,
  returnAfterLoginPaypal,
  authorizationEndpoint,
  chargeCoin,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/create-order", createOrder);
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.post("/payout", payoutOrder);
router.get("/after-login", returnAfterLoginPaypal);
router.get("/authorization-endpoint", authorizationEndpoint);
router.post("/charge-coin", chargeCoin);
export default router;
