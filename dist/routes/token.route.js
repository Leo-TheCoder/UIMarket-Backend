"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const token_controller_1 = require("../controllers/token.controller");
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
//GET Method
router.get("/revoke", authentication_1.compulsoryAuth, token_controller_1.revoke);
//POST Method
router.post("/refresh", token_controller_1.refreshAccessToken);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=token.route.js.map