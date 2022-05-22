"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = express_1.default.Router();
//POST Method
router.post("/", invoice_controller_1.createOrder);
router.post("/preOrder", invoice_controller_1.preOrder);
exports.default = router;
//# sourceMappingURL=invoice.route.js.map