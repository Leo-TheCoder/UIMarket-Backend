import express from "express";
import { compulsoryAuth } from "../middlewares/authentication";
import {
  createCategory,
  getAllCategory,
} from "../controllers/productCategory.controller";

const router = express.Router();

//GET Method
router.get("/", getAllCategory);

//POST Method
// router.post("/category", createCategory);

//PUT Method
//DELETE Method

export default router;
