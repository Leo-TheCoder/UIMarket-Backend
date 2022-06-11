import express from "express";
import {
  createOrder,
  captureOrder,
  cancelPayment,
  withdrawPayment,
  returnAfterLoginPaypal,
  authorizationEndpoint,
  chargeCoin,
  refundPayment,
  paymentHistory,
  createRequestRefund,
  testPaypal,
  testCapturePaypal,
  getBuyerFee,
  getSellerFee,
  preOrder
} from "../controllers/payment.controller";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/buyer-fee", getBuyerFee);
router.get("/seller-fee", getSellerFee);
router.get("/capture-order/paypal", compulsoryAuth, captureOrder);
router.get("/cancel-payment", cancelPayment);
router.get("/after-login", compulsoryAuth, returnAfterLoginPaypal);
router.get("/authorization-endpoint", compulsoryAuth, authorizationEndpoint);
router.get("/history/", compulsoryAuth, paymentHistory);

//POST Method
router.post("/check-order", compulsoryAuth, preOrder);
router.post("/create-order/paypal", compulsoryAuth, createOrder);
router.post("/withdraw", compulsoryAuth, withdrawPayment);
router.post("/charge-coin", chargeCoin);
router.post("/request/refund", compulsoryAuth, createRequestRefund);

router.get("/test/order", testPaypal);
router.get("/test/capture", testCapturePaypal);
router.post("/test/refund", refundPayment);
//PUT Method
//DELETE Method

export default router;
