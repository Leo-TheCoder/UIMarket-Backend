"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
//GET Method
router.get("/login", authentication_1.compulsoryAuth, auth_controller_1.loginWithToken);
//POST Method
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/forgetPassword", auth_controller_1.forgetPasswordEmail);
router.post("/resetPassword", authentication_1.compulsoryAuth, auth_controller_1.resetPassword);
router.post("/login-google", auth_controller_1.googleLogin);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=auth.route.js.map