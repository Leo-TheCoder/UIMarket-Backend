import express from "express";
import {
  createOrder,
  captureOrder,
  cancelPayment,
  payoutOrder,
  returnAfterLoginPaypal,
  authorizationEndpoint,
  chargeCoin,
  refundPayment,
} from "../controllers/payment.controller";
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.get("/after-login", compulsoryAuth, returnAfterLoginPaypal);
router.get("/authorization-endpoint", compulsoryAuth, authorizationEndpoint);

//POST Method
router.post("/create-order", compulsoryAuth, createOrder);
router.post("/payout", payoutOrder);
router.post("/charge-coin", chargeCoin);
router.post("/refund", refundPayment);

//PUT Method
//DELETE Method

export default router;
