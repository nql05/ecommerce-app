import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import adminController from "../controllers/adminController";

const router = express.Router();

router.get(
  "/sellers",
  authenticate,
  authorize(["admin"]),
  adminController.listSellers
);
router.get(
  "/sellers/:loginName",
  authenticate,
  authorize(["admin"]),
  adminController.readSeller
);
// router.put('/sellers/:loginName', authenticate, authorize(['admin']), adminController.editUser);

router.get(
  "/buyers",
  authenticate,
  authorize(["admin"]),
  adminController.listBuyers
);
router.get(
  "/buyers/:loginName",
  authenticate,
  authorize(["admin"]),
  adminController.readBuyer
);

export default router;
