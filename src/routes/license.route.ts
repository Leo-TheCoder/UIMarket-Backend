import express from "express";
import { createLicense } from "../controllers/license.controller";

const router = express.Router();

//GET Method

//POST Method
router.post("/", createLicense);

//PUT Method

//DELETE Method

export default router;
