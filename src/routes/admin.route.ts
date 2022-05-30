import express from "express";
import { adminAuth, compulsoryAuth } from "../middlewares/authentication";
import {
  createCategory,
  getAllCategory,
} from "../controllers/productCategory.controller";

import {
  getAllUsers,
  deactiveUser,
  activeUser,
  unverifyUser,
  sendMailForTest,
} from "../controllers/admin/users.controller";
import {
  activeShop,
  deactiveShop,
  getAllShops,
} from "../controllers/admin/shops.controller";
import { changeSystemFee } from "../controllers/admin/system.controller";
import { rejectReport } from "../controllers/report.controller";

const router = express.Router();

//===================== User =====================
//GET Method
router.get("/users", getAllUsers);

//POST Method
router.post("/email", sendMailForTest);

//PUT Method
router.put("/users/:userId/deactive", deactiveUser);
router.put("/users/:userId/active", activeUser);
router.put("/users/:userId/unverify", unverifyUser);

//===================== Shop =====================
//GET Method
router.get("/shops", getAllShops);

//PUT Method
router.put("/shops/:shopId/deactive", deactiveShop);
router.put("/shops/:shopId/active", activeShop);

//===================== Category =====================
//POST Method
router.post("/category", createCategory);

//===================== System =======================
//POST Method
router.post("/system/fee", changeSystemFee);
//PUT Method
//DELETE Method

//===================== Report =======================
//PUT Method
router.put("/report/reject/:reportId", adminAuth, rejectReport);
export default router;
