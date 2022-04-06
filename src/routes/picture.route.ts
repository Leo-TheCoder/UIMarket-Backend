import express from "express";
import { uploadURL } from "../controllers/picture.controller";

const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.get("/avatar/", downloadAvatar);
router.get("/:folder/upload", uploadURL);
// router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
