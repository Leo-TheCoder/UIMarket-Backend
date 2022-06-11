"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
//GET Method
router.get("/buyer-fee", payment_controller_1.getBuyerFee);
router.get("/seller-fee", payment_controller_1.getSellerFee);
router.get("/capture-order/paypal", authentication_1.compulsoryAuth, payment_controller_1.captureOrder);
router.get("/cancel-payment", payment_controller_1.cancelPayment);
router.get("/after-login", authentication_1.compulsoryAuth, payment_controller_1.returnAfterLoginPaypal);
router.get("/authorization-endpoint", authentication_1.compulsoryAuth, payment_controller_1.authorizationEndpoint);
router.get("/history/", authentication_1.compulsoryAuth, payment_controller_1.paymentHistory);
//POST Method
router.post("/check-order", authentication_1.compulsoryAuth, payment_controller_1.preOrder);
router.post("/create-order/paypal", authentication_1.compulsoryAuth, payment_controller_1.createOrder);
router.post("/withdraw", authentication_1.compulsoryAuth, payment_controller_1.withdrawPayment);
router.post("/charge-coin", payment_controller_1.chargeCoin);
router.post("/refund", payment_controller_1.refund);
router.post("/request/refund", authentication_1.compulsoryAuth, payment_controller_1.createRequestRefund);
router.get("/test/order", payment_controller_1.testPaypal);
router.get("/test/capture", payment_controller_1.testCapturePaypal);
router.post("/test/refund", payment_controller_1.refundPayment);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=payment.route.js.map