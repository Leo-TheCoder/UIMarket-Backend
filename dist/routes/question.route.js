"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../middlewares/authentication");
const question_controller_1 = require("../controllers/question.controller");
const router = express_1.default.Router();
//GET Methods
router.get("/", question_controller_1.getQuestions);
router.get("/:id", authentication_1.optionalAuth, question_controller_1.getQuestionByID);
//POST Methods
router.post("/", authentication_1.compulsoryAuth, question_controller_1.createQuestion);
//PUT Methods
router.put("/rebounty/:questionId/", authentication_1.compulsoryAuth, question_controller_1.rebountyQuestion);
router.put("/update/:questionId", authentication_1.compulsoryAuth, question_controller_1.updateQuestion);
router.put("/choose/:questionId/:answerId", authentication_1.compulsoryAuth, question_controller_1.chooseBestAnswer);
//DELETE Methods
router.delete("/:questionId", authentication_1.compulsoryAuth, question_controller_1.deleteQuestion);
exports.default = router;
//# sourceMappingURL=question.route.js.map