"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const router = express_1.default.Router();
//GET Method
//POST Method/
router.post("/:invoiceId/:productId", review_controller_1.createReview);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=review.route.js.map