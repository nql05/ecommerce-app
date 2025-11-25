import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import buyerController from "../controllers/buyerController";

const router = express.Router();

router.get("/products", buyerController.listProducts);
router.get("/products/:id", buyerController.getProductDetails);

router.post(
  "/cart",
  authenticate,
  authorize(["B", "A"]),
  buyerController.addToCart
);

router.get(
  "/cart",
  authenticate,
  authorize(["B", "A"]),
  buyerController.getCart
);

router.put(
  "/cart",
  authenticate,
  authorize(["B", "A"]),
  buyerController.proceedCart
)

router.delete(
  "/cart",
  authenticate,
  authorize(["B", "A"]),
  buyerController.removeFromCart
);

router.post(
  "/order/create",
  authenticate,
  authorize(["B", "A"]),
  buyerController.createOrder
);

router.get(
  "/order/:id",
  authenticate,
  authorize(["B", "A"]),
  buyerController.readOrderDetails
);

export default router;
