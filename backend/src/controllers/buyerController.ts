import { Request, Response } from "express";
import buyerService from "../services/buyerService";
import { parsePrismaError } from "../utils/prismaError";

export const listProducts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const products = await buyerService.findMany(search as string | undefined);
    return res.json(products);
  } catch (err) {
    console.error(`listProducts error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  try {
    const product = await buyerService.findUnique(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(`getProductDetails ${id} error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { ProductID, SKUName, Quantity } = req.body;
    await buyerService.addToCart(
      (req as any).user.loginName,
      ProductID,
      SKUName,
      Quantity
    );
    return res.json({ message: "Added to cart" });
  } catch (err) {
    console.error(`addToCart error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await buyerService.getCart((req as any).user.loginName);
    return res.json(cart);
  } catch (err) {
    console.error(`getCart error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const { ProductID, SKUName, Quantity } = req.body;

    if (Quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await buyerService.updateCartQuantity(
      (req as any).user.loginName,
      ProductID,
      SKUName,
      Quantity
    );
    return res.json({ message: "Updated" });
  } catch (err) {
    console.error(`updateCart error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { ProductID, SKUName } = req.body;
    await buyerService.removeFromCart(
      (req as any).user.loginName,
      ProductID,
      SKUName
    );
    return res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error(`removeFromCart error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { Skus, AddressID, ProviderName, AccountID } = req.body;
    const order = await buyerService.createOrder(
      (req as any).user.loginName,
      Skus,
      AddressID,
      ProviderName,
      AccountID
    );
    return res.json(order);
  } catch (err) {
    console.error(`createOrder error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export const readOrderDetails = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid OrderID" });
  try {
    const order = await buyerService.readOrderDetails(
      id
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error(`readOrderDetails ${id} error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
  }
};

export default {
  listProducts,
  getProductDetails,
  addToCart,
  getCart,
  removeFromCart,
  updateCart,
  createOrder,
  readOrderDetails,
};
