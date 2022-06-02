"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const license_controller_1 = require("../controllers/license.controller");
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
//GET Method
router.get("/list", authentication_1.compulsoryAuth, license_controller_1.getLicenseList);
router.get("/detail/:licenseId", authentication_1.compulsoryAuth, license_controller_1.getLicenseById);
//POST Method
router.post("/", license_controller_1.createLicense);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=license.route.js.map