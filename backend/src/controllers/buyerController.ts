import { Request, Response } from "express";
import buyerService from "../services/buyerService";

export const listProducts = async (req: Request, res: Response) => {
  const { search } = req.query;
  const products = await buyerService.findMany(search as string | undefined);
  res.json(products);
};

export const getProductDetails = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  const product = await buyerService.findUnique(id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productID, skuName, quantity } = req.body;
    await buyerService.addToCart(
      (req as any).user.loginName,
      productID,
      skuName,
      quantity
    );
    res.json({ message: "Added to cart" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getCart = async (req: Request, res: Response) => {
  const cart = await buyerService.getCart((req as any).user.loginName);
  res.json(cart);
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const { productID, skuName, quantity } = req.body;
    await buyerService.updateCartQuantity(
      (req as any).user.loginName,
      productID,
      skuName,
      quantity
    );
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { productID, skuName } = req.body;
    await buyerService.removeFromCart(
      (req as any).user.loginName,
      productID,
      skuName
    );
    res.json({ message: "Removed from cart" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { skus, addressID, providerName, accountID } = req.body;
  const order = await buyerService.createOrder(
    (req as any).user.loginName,
    skus,
    addressID,
    providerName,
    accountID
  );
  res.json(order);
};

export default {
  listProducts,
  getProductDetails,
  addToCart,
  getCart,
  removeFromCart,
  updateCart,
  createOrder,
};
