import express from "express";
import { createOrder, preOrder } from "../controllers/invoice.controller";

const router = express.Router();

//POST Method
router.post("/", createOrder);
router.post("/preOrder", preOrder);

export default router;
