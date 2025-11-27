import { Request, Response } from "express";
import sellerService from "../services/sellerService";
import { parsePrismaError } from "../utils/prismaError";

export const listProducts = async (req: Request, res: Response) => {
  try {
    const loginName = (req as any).user?.loginName;
    if (!loginName) return res.status(401).json({ error: "Unauthorized" });

    const products = await sellerService.listSellerProducts(loginName);
    return res.json(products);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`listProducts error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const addProduct = async (req: Request, res: Response) => {
  try {
    const loginName = (req as any).user?.loginName;
    if (!loginName) return res.status(401).json({ error: "Unauthorized" });

    const product = await sellerService.createProduct(loginName, req.body);
    return res.status(201).json(product);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`addProduct error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const readProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });

  try {
    const product = await sellerService.readProduct(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`readProduct ${id} error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const editProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });

  try {
    const product = await sellerService.updateProduct(id, req.body);
    return res.json(product);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`editProduct ${id} error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    // If parser determines 404, forward that; otherwise use parser status
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const removeProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });

  try {
    await sellerService.deleteProduct(id);
    return res.json({ message: "Deleted" });
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`removeProduct ${id} error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const earnings = async (req: Request, res: Response) => {
  try {
    const loginName = (req as any).user?.loginName;
    if (!loginName) return res.status(401).json({ error: "Unauthorized" });

    const value = await sellerService.getEarnings(loginName);
    return res.json({ earnings: value });
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`earnings error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const getProductStatistics = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });

  try {
    const stats = await sellerService.getProductStatistics(id);
    return res.json(stats);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`getProductStatistics ${id} error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export const removeSku = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const skuName = req.params.skuName;

  if (isNaN(id)) return res.status(400).json({ error: "Invalid ProductID" });
  if (!skuName) return res.status(400).json({ error: "Invalid SKU Name" });

  try {
    await sellerService.deleteSku(id, skuName);
    return res.json({ message: "SKU Deleted" });
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`removeSku ${id} ${skuName} error: ${originalMessage}`);
    const parsed = parsePrismaError(error);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      details: parsed.details,
    });
  }
};

export default {
  listProducts,
  addProduct,
  readProduct,
  editProduct,
  removeProduct,
  removeSku,
  earnings,
  getProductStatistics,
};
