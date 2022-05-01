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
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);
router.get("/after-login", returnAfterLoginPaypal);
router.get("/authorization-endpoint", compulsoryAuth, authorizationEndpoint);

//POST Method
router.post("/create-order", createOrder);
router.post("/payout", payoutOrder);
router.post("/charge-coin", chargeCoin);

//PUT Method
//DELETE Method

export default router;
