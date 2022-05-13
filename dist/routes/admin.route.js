"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productCategory_controller_1 = require("../controllers/productCategory.controller");
const router = express_1.default.Router();
//GET Method
// router.get("/category", getAllCategory);
//POST Method
router.post("/category", productCategory_controller_1.createCategory);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=admin.route.js.map