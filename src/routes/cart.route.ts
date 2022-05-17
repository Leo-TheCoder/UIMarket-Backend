import express from "express";
import {
  addProduct,
  removeFromCart,
  viewCart,
} from "../controllers/cart.controller";

const router = express.Router();

//GET Method
router.get("/", viewCart);

//POST Method
router.post("/", addProduct);

//PUT Method

//DELETE Method
router.delete("/:productId", removeFromCart);

export default router;
