"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const license_controller_1 = require("../controllers/license.controller");
const router = express_1.default.Router();
//GET Method
//POST Method
router.post("/", license_controller_1.createLicense);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=license.route.js.map