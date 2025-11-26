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
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
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
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const addresses = await buyerService.getAddresses(
      (req as any).user.loginName
    );
    return res.json(addresses);
  } catch (err) {
    console.error(`getAddresses error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
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
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await buyerService.getCart((req as any).user.loginName);
    return res.json(cart);
  } catch (err) {
    console.error(`getCart error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
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
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
  }
};

/**
 * Remove the selected Skus from the cart and add it to a new order
 */
export const proceedCart = async (req: Request, res: Response) => {
  try {
    const {
      Skus,
      AddressID,
      ProviderName,
      AccountID,
      DeliveryMethodName,
      DeliveryProviderName,
    } = req.body;

    if (!Array.isArray(Skus) || Skus.length === 0) {
      throw new Error("Invalid, no skus to proceed Order");
    }

    // First delete Skus from cart
    for (const Sku of Skus) {
      await buyerService.removeFromCart(
        (req as any).user.loginName,
        Sku.ProductID,
        Sku.SKUName
      );
    }

    // Then create order with the selected SKUs (currently, we ignore the quantity in the request vs in the cart)
    const order = await buyerService.createOrder(
      (req as any).user.loginName,
      Skus,
      AddressID,
      ProviderName,
      DeliveryMethodName,
      DeliveryProviderName,
      AccountID
    );

    return res.json(order);
  } catch (err) {
    console.error(`Error proceeding Cart to Order ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res.status(parsed.status).json({
      error: parsed.message,
      code: parsed.code,
      detail: parsed.details,
    });
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
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
  }
};

// export const createOrder = async (req: Request, res: Response) => {
//   try {
//     const { Skus, AddressID, ProviderName, AccountID, DeliveryMethodName, DeliveryProviderName } = req.body;
//     const order = await buyerService.createOrder(
//       (req as any).user.loginName,
//       Skus,
//       AddressID,
//       ProviderName,
//       DeliveryMethodName,
//       DeliveryProviderName,
//       AccountID
//     );
//     return res.json(order);
//   } catch (err) {
//     console.error(`createOrder error: ${(err as Error).message}`);
//     const parsed = parsePrismaError(err);
//     return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
//   }
// };

export const readOrderDetails = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid OrderID" });
  try {
    const order = await buyerService.readOrderDetails(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error(`readOrderDetails ${id} error: ${(err as Error).message}`);
    const parsed = parsePrismaError(err);
    return res
      .status(parsed.status)
      .json({
        error: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
  }
};

export default {
  listProducts,
  getProductDetails,
  getAddresses,
  addToCart,
  getCart,
  proceedCart,
  removeFromCart,
  updateCart,
  // createOrder,
  readOrderDetails,
};
