"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const profile_controller_1 = require("../controllers/profile.controller");
const router = express_1.default.Router();
//GET Method
router.get("/activity/:userId", authentication_1.optionalAuth, profile_controller_1.getProfileActivity);
router.get("/info/:userId", authentication_1.optionalAuth, profile_controller_1.getProfileInfo);
router.get("/portfolio/:userId", authentication_1.optionalAuth, profile_controller_1.getPortfolio);
//POST Method
router.post("/info", authentication_1.compulsoryAuth, profile_controller_1.updateProfile);
router.post("/portfolio", authentication_1.compulsoryAuth, profile_controller_1.updatePortfolio);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=profile.route.js.map