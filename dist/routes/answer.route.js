"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const answer_controller_1 = require("../controllers/answer.controller");
const router = express_1.default.Router();
//GET Method
router.get("/:questionId", authentication_1.optionalAuth, answer_controller_1.getAnswer);
//POST Method
router.post("/:questionId", authentication_1.compulsoryAuth, answer_controller_1.createAnswer);
//PUT Method
router.put("/:answerId", authentication_1.compulsoryAuth, answer_controller_1.updateAnswer);
//DELETE Method
router.delete("/:answerId", authentication_1.compulsoryAuth, answer_controller_1.deleteAnswer);
exports.default = router;
//# sourceMappingURL=answer.route.js.map