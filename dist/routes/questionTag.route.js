"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const questionTag_controller_1 = require("../controllers/questionTag.controller");
const router = express_1.default.Router();
//GET Method
router.get("/", questionTag_controller_1.getTags);
//POST Method
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=questionTag.route.js.map