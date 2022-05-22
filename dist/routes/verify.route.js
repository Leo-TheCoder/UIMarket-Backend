"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
//GET Method
router.get("/", auth_controller_1.verifyEmailCode);
router.get("/resend", auth_controller_1.resendVerifyEmail);
//POST Method
router.post("/resetForgetPassword", auth_controller_1.resetForgetPassword);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=verify.route.js.map