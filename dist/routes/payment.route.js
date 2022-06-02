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
router.get("/capture-order", authentication_1.compulsoryAuth, payment_controller_1.captureOrder);
router.get("/cancel-payment", payment_controller_1.cancelPayment);
router.get("/after-login", authentication_1.compulsoryAuth, payment_controller_1.returnAfterLoginPaypal);
router.get("/authorization-endpoint", authentication_1.compulsoryAuth, payment_controller_1.authorizationEndpoint);
router.get("/history/", authentication_1.compulsoryAuth, payment_controller_1.paymentHistory);
//POST Method
router.post("/create-order", authentication_1.compulsoryAuth, payment_controller_1.createOrder);
router.post("/withdraw", authentication_1.compulsoryAuth, payment_controller_1.withdrawPayment);
router.post("/charge-coin", payment_controller_1.chargeCoin);
router.post("/refund", payment_controller_1.refundPayment);
router.post("/request/refund", authentication_1.compulsoryAuth, payment_controller_1.createRequestRefund);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=payment.route.js.map