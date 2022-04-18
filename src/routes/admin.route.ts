import express from "express";
import { compulsoryAuth } from "../middlewares/authentication";
import {
  createCategory,
  getAllCategory,
} from "../controllers/admin.controller";

const router = express.Router();

//GET Method
router.get("/category", getAllCategory);

//POST Method
router.post("/category", createCategory);

//PUT Method
//DELETE Method

export default router;
