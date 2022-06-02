"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const file_controller_1 = require("../controllers/file.controller");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
//GET Method
// router.get("/avatar/", downloadAvatar);
router.get("/upload", file_controller_1.uploadURL);
router.get("/download", file_controller_1.generatedownloadURL);
//POST Method
// router.post("/avatar", upload.single("avatar"), uploadAvatar);
//PUT Method
//DELETE Method
exports.default = router;
//# sourceMappingURL=file.route.js.map