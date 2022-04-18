import express from "express";
import { uploadURL } from "../controllers/file.controller";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

//GET Method
// router.get("/avatar/", downloadAvatar);
router.get("/upload", uploadURL);

//POST Method
// router.post("/avatar", upload.single("avatar"), uploadAvatar);

//PUT Method
//DELETE Method

export default router;
