import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import {
  findByCategory,
  findById,
  findByName,
} from "../controllers/product.controller";

const router = express.Router();

//GET Method
router.get("/category/:categoryId", findByCategory);
router.get("/:productId", findById);
router.get("/search/:productName", findByName);

//POST Method
//PUT Method
//DELETE Method

export default router;
