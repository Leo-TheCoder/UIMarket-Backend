import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import { findByCategory } from "../controllers/product.controller";

const router = express.Router();

//GET Method
router.get("/category/:categoryId", findByCategory);

//POST Method
//PUT Method
//DELETE Method

export default router;
