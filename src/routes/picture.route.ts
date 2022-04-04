import express from "express";
import { uploadURL, uploadAvatar } from "../controllers/picture.controller";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// router.get("/avatar/", downloadAvatar);
router.get("/:folder/upload", uploadURL);
router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
