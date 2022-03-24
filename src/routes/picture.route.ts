import express from "express";
import multer from "multer";
import {
  // downloadAvatar,
  // uploadAvatar,
  uploadURL,
} from "../controllers/picture.controller";

const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.get("/avatar/", downloadAvatar);
router.get("/:folder/upload", uploadURL);
// router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
