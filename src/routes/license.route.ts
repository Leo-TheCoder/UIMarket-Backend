import express from "express";
import {
  createLicense,
  getLicenseById,
  getLicenseList,
} from "../controllers/license.controller";
import { compulsoryAuth, optionalAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/list", compulsoryAuth, getLicenseList);
router.get("/detail/:licenseId", optionalAuth, getLicenseById);

//POST Method
router.post("/", createLicense);

//PUT Method

//DELETE Method

export default router;
