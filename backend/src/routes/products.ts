import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../mssql/prisma';

const router = express.Router();

// Get products
router.get('/', async (req, res) => {
  const { search } = req.query;
  const products = await prisma.productInfo.findMany({
    where: search ? { ProductName: { contains: search as string } } : {},
    include: { SKU: { include: { Comment: true } } }
  });
  res.json(products);
});

// Get product details
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ProductID' });
  }
  const product = await prisma.productInfo.findUnique({
    where: { ProductID: id },
    include: { SKU: { include: { Comment: true } } }
  });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Add to cart
router.post('/cart', authenticate, authorize(['buyer']), async (req: AuthRequest, res) => {
  const { productID, skuName, quantity } = req.body;
  const cart = await prisma.cart.findFirst({ where: { LoginName: req.user.loginName } });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  await prisma.storedSKU.upsert({
    where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } },
    update: { Quantity: { increment: quantity } },
    create: { CartID: cart.CartID, ProductID: productID, SKUName: skuName, Quantity: quantity }
  });
  res.json({ message: 'Added to cart' });
});

// Get cart
router.get('/cart', authenticate, authorize(['buyer']), async (req: AuthRequest, res) => {
  const cart = await prisma.cart.findFirst({
    where: { LoginName: req.user.loginName },
    include: { StoredSKU: { include: { SKU: { include: { ProductInfo: true } } } } }
  });
  res.json(cart);
});

// Update cart quantity
router.put('/cart', authenticate, authorize(['buyer']), async (req: AuthRequest, res) => {
  const { productID, skuName, quantity } = req.body;
  const cart = await prisma.cart.findFirst({ where: { LoginName: req.user.loginName } });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  await prisma.storedSKU.update({
    where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } },
    data: { Quantity: quantity }
  });
  res.json({ message: 'Updated' });
});

// Create order
router.post('/order', authenticate, authorize(['buyer']), async (req: AuthRequest, res) => {
  const { skus, addressID, providerName, accountID } = req.body;
  const order = await prisma.orderInfo.create({
    data: { LoginName: req.user.loginName, AddressID: addressID, ProviderName: providerName, AccountID: accountID }
  });
  const shopGroups = skus.reduce((acc: Record<string, any[]>, sku: any) => {
    const shop = sku.productInfo.LoginName;
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(sku);
    return acc;
  }, {});
  for (const shop in shopGroups) {
    const subOrder = await prisma.subOrderInfo.create({
      data: { OrderID: order.OrderID, DeliveryMethodName: 'Standard', DeliveryProviderName: 'Default', ActualDate: new Date(), ExpectedDate: new Date() }
    });
    for (const sku of shopGroups[shop]) {
      await prisma.subOrderDetail.create({
        data: { OrderID: order.OrderID, SubOrderID: subOrder.SubOrderID, ProductID: sku.ProductID, SKUName: sku.SKUName, Quantity: sku.Quantity }
      });
    }
  }
  res.json(order);
});

export default router;

