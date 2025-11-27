import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import sellerController from "../controllers/sellerController";

const router = express.Router();

// See all sellers' products
router.get(
  "/products",
  authenticate,
  authorize(["S", "A"]),
  sellerController.listProducts
);

// Add a new product
router.post(
  "/products/add",
  authenticate,
  authorize(["S", "A"]),
  sellerController.addProduct
);

// View product details
router.get(
  "/products/:id",
  authenticate,
  authorize(["S", "A"]),
  sellerController.readProduct
);

// Edit a product details
router.put(
  "/products/:id",
  authenticate,
  authorize(["S", "A"]),
  sellerController.editProduct
);

// Delete a product
router.delete(
  "/products/:id",
  authenticate,
  authorize(["S", "A"]),
  sellerController.removeProduct
);

// Delete a specific SKU
router.delete(
  "/products/:id/sku/:skuName",
  authenticate,
  authorize(["S", "A"]),
  sellerController.removeSku
);

// View product statistics
router.get(
  "/products/:id/statistics",
  authenticate,
  authorize(["S", "A"]),
  sellerController.getProductStatistics
);

// View earnings
router.get(
  "/earnings",
  authenticate,
  authorize(["S", "A"]),
  sellerController.earnings
);

// TODO: Post comment - Future version

export default router;
