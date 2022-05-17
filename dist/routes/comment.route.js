"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const comment_controller_1 = require("../controllers/comment.controller");
const router = express_1.default.Router();
//GET Method
router.get("/:rootId", authentication_1.optionalAuth, comment_controller_1.getComments);
//POST Method
router.post("/", authentication_1.compulsoryAuth, comment_controller_1.createComment);
//PUT Method
router.put("/:commentId", authentication_1.compulsoryAuth, comment_controller_1.updateComment);
//DELETE Method
router.delete("/:commentId", authentication_1.compulsoryAuth, comment_controller_1.deleteComment);
exports.default = router;
//# sourceMappingURL=comment.route.js.map