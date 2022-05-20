import express from "express";
import {
  createLicense,
  getLicenseById,
  getLicenseList,
} from "../controllers/license.controller";
import { compulsoryAuth } from "../middlewares/authentication";

const router = express.Router();

//GET Method
router.get("/list", compulsoryAuth, getLicenseList);
router.get("/detail/:licenseId", compulsoryAuth, getLicenseById);

//POST Method
router.post("/", createLicense);

//PUT Method

//DELETE Method

export default router;
