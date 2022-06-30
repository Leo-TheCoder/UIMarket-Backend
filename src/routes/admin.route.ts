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
  profileDetail,
  getShopTransaction,
} from "../controllers/admin/users.controller";
import {
  activeShop,
  deactiveShop,
  getAllShops,
} from "../controllers/admin/shops.controller";
import { changeSystemFee } from "../controllers/admin/system.controller";
import {
  acceptReport,
  getReportDetail,
  rejectReport,
  reportListAll,
  reportListEC,
  reportListEdu,
} from "../controllers/report.controller";
import {
  acceptRefund,
  getAllRefund,
  getRefundById,
  rejectRefund,
} from "../controllers/admin/refund.controller";

const router = express.Router();

//===================== User =====================
//GET Method
router.get("/users", getAllUsers);
router.get("/users/:userId", profileDetail);
//POST Method
router.post("/email", sendMailForTest);

//PUT Method
router.put("/users/:userId/deactive", deactiveUser);
router.put("/users/:userId/active", activeUser);
router.put("/users/:userId/unverify", unverifyUser);

//===================== Shop =====================
//GET Method
router.get("/shops", getAllShops);
router.get("/shops/:shopId/payment-history", getShopTransaction);

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
//GET Method
router.get("/report/list/Edu", reportListEdu);
router.get("/report/list/EC", reportListEC);
router.get("/report/list/All", reportListAll);
router.get("/report/detail/:objectId", getReportDetail);

//PUT Method
router.put("/report/reject/:reportId", rejectReport);
router.put("/report/accept/:reportId", acceptReport);

//===================== Refund ========================
//GET Method
router.get("/refund", getAllRefund);
router.get("/refund/:refundId", getRefundById);
//POST Method
router.post("/refund/accept/:refundId", acceptRefund);
router.post("/refund/reject/:refundId", rejectRefund);

export default router;
