"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cart_controller_1 = require("../controllers/cart.controller");
const router = express_1.default.Router();
//GET Method
router.get("/", cart_controller_1.viewCart);
//POST Method
router.post("/", cart_controller_1.addProduct);
//PUT Method
//DELETE Method
router.delete("/:productId", cart_controller_1.removeFromCart);
exports.default = router;
//# sourceMappingURL=cart.route.js.map