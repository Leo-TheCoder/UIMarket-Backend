import express from "express";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";
import { createShop } from "../controllers/shop.controller";

const router = express.Router();

//POST Method
router.post("/register", compulsoryAuth, createShop);

export default router;
