"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = express_1.default.Router();
//GET
router.get("/history", invoice_controller_1.purchaseHistory);
router.get("/history/:productName", invoice_controller_1.searchPurchaseHistory);
router.get("/transaction", invoice_controller_1.getShopTransaction);
//POST Method
router.post("/", invoice_controller_1.createOrder);
router.post("/preOrder", invoice_controller_1.preOrder);
exports.default = router;
//# sourceMappingURL=invoice.route.js.map