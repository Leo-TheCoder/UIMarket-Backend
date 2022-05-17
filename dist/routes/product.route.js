"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const router = express_1.default.Router();
//GET Method
router.get("/", product_controller_1.getAllProducts);
router.get("/info/:productId", product_controller_1.findById);
router.get("/category/:categoryId", product_controller_1.findByCategory);
router.get("/search/:productName", product_controller_1.findByName);
router.get("/shop/:shopId", product_controller_1.getProductsByShop);
//POST Method
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=product.route.js.map