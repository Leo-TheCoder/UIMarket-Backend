"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const shop_controller_1 = require("../controllers/shop.controller");
const router = express_1.default.Router();
//GET Method
router.get("/product", authentication_1.compulsoryAuth, shop_controller_1.getAllProduct);
router.get("/product/statistic", authentication_1.compulsoryAuth, shop_controller_1.getProductStatistic);
router.get("/info/:shopId", authentication_1.optionalAuth, shop_controller_1.getShopById);
router.get("/search/:shopName", shop_controller_1.getShopByName);
//POST Method/
router.post("/register", authentication_1.compulsoryAuth, shop_controller_1.createShop);
router.post("/product", authentication_1.compulsoryAuth, shop_controller_1.uploadProduct);
//PUT Method
router.put("/", authentication_1.compulsoryAuth, shop_controller_1.updateShop);
router.put("/product/:productId", authentication_1.compulsoryAuth, shop_controller_1.updateProduct);
router.put("/product/deactive/:productId", authentication_1.compulsoryAuth, shop_controller_1.deactiveProduct);
router.put("/product/active/:productId", authentication_1.compulsoryAuth, shop_controller_1.activeProduct);
//DELETE Method
router.delete("/product/:productId", authentication_1.compulsoryAuth, shop_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=shop.route.js.map