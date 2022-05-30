"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const review_controller_1 = require("../controllers/review.controller");
const router = express_1.default.Router();
//GET Method
router.get("/:productId", review_controller_1.getProductReviews);
router.get("/detail/:reviewId", review_controller_1.getReviewById);
router.get("/user/list", authentication_1.compulsoryAuth, review_controller_1.getUserReview);
//POST Method/
router.post("/:invoiceId/:productId", authentication_1.compulsoryAuth, review_controller_1.createReview);
//PUT Method
router.put("/:reviewId", authentication_1.compulsoryAuth, review_controller_1.updateReview);
//DELETE Method
exports.default = router;
//# sourceMappingURL=review.route.js.map