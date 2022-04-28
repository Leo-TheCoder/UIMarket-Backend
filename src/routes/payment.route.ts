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
import {compulsoryAuth} from "../middlewares/authentication";

const router = express.Router();

router.post("/create-order", createOrder);
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.post("/payout", payoutOrder);
router.get("/after-login", returnAfterLoginPaypal);
router.get("/authorization-endpoint", compulsoryAuth, authorizationEndpoint);
router.post("/charge-coin", chargeCoin);
export default router;
