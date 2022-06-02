"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productCategory_controller_1 = require("../controllers/productCategory.controller");
const users_controller_1 = require("../controllers/admin/users.controller");
const shops_controller_1 = require("../controllers/admin/shops.controller");
const system_controller_1 = require("../controllers/admin/system.controller");
const router = express_1.default.Router();
//===================== User =====================
//GET Method
router.get("/users", users_controller_1.getAllUsers);
//POST Method
router.post("/email", users_controller_1.sendMailForTest);
//PUT Method
router.put("/users/:userId/deactive", users_controller_1.deactiveUser);
router.put("/users/:userId/active", users_controller_1.activeUser);
router.put("/users/:userId/unverify", users_controller_1.unverifyUser);
//===================== Shop =====================
//GET Method
router.get("/shops", shops_controller_1.getAllShops);
//PUT Method
router.put("/shops/:shopId/deactive", shops_controller_1.deactiveShop);
router.put("/shops/:shopId/active", shops_controller_1.activeShop);
//===================== Category =====================
//POST Method
router.post("/category", productCategory_controller_1.createCategory);
//===================== System =======================
//POST Method
router.post("/system/fee", system_controller_1.changeSystemFee);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=admin.route.js.map