import { Request, Response } from "express";
import sellerService from "../services/sellerService";

export const listProducts = async (req: Request, res: Response) => {
  const loginName = (req as any).user.loginName;
  const products = await sellerService.listSellerProducts(loginName);
  res.json(products);
};

export const addProduct = async (req: Request, res: Response) => {
  const loginName = (req as any).user.loginName;
  const product = await sellerService.createProduct(loginName, req.body);
  res.json(product);
};

export const readProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  const product = await sellerService.readProduct(id);
  res.json(product);
};

export const editProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  const product = await sellerService.updateProduct(id, req.body);
  res.json(product);
};

export const removeProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  await sellerService.deleteProduct(id);
  res.json({ message: "Deleted" });
};

export const earnings = async (req: Request, res: Response) => {
  const loginName = (req as any).user.loginName;
  const value = await sellerService.getEarnings(loginName);
  res.json({ earnings: value });
};

export default {
  listProducts,
  addProduct,
  readProduct,
  editProduct,
  removeProduct,
  earnings,
};
