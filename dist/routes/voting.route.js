"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upvoting_controller_1 = require("../controllers/upvoting.controller");
const downvoting_controller_1 = require("../controllers/downvoting.controller");
const router = express_1.default.Router();
//GET Method
//POST Method
router.post("/upvote", upvoting_controller_1.upvote);
router.post("/downvote", downvoting_controller_1.downvote);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=voting.route.js.map