"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../mssql/prisma"));
const router = express_1.default.Router();
// Get products
router.get('/', async (req, res) => {
    const { search } = req.query;
    const products = await prisma_1.default.productInfo.findMany({
        where: search ? { ProductName: { contains: search } } : {},
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
    const product = await prisma_1.default.productInfo.findUnique({
        where: { ProductID: id },
        include: { SKU: { include: { Comment: true } } }
    });
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});
// Add to cart
router.post('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), async (req, res) => {
    const { productID, skuName, quantity } = req.body;
    const cart = await prisma_1.default.cart.findFirst({ where: { LoginName: req.user.loginName } });
    if (!cart)
        return res.status(404).json({ error: 'Cart not found' });
    await prisma_1.default.storedSKU.upsert({
        where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } },
        update: { Quantity: { increment: quantity } },
        create: { CartID: cart.CartID, ProductID: productID, SKUName: skuName, Quantity: quantity }
    });
    res.json({ message: 'Added to cart' });
});
// Get cart
router.get('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), async (req, res) => {
    const cart = await prisma_1.default.cart.findFirst({
        where: { LoginName: req.user.loginName },
        include: { StoredSKU: { include: { SKU: { include: { ProductInfo: true } } } } }
    });
    res.json(cart);
});
// Update cart quantity
router.put('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), async (req, res) => {
    const { productID, skuName, quantity } = req.body;
    const cart = await prisma_1.default.cart.findFirst({ where: { LoginName: req.user.loginName } });
    if (!cart)
        return res.status(404).json({ error: 'Cart not found' });
    await prisma_1.default.storedSKU.update({
        where: { ProductID_CartID_SKUName: { ProductID: productID, CartID: cart.CartID, SKUName: skuName } },
        data: { Quantity: quantity }
    });
    res.json({ message: 'Updated' });
});
// Create order
router.post('/order', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), async (req, res) => {
    const { skus, addressID, providerName, accountID } = req.body;
    const order = await prisma_1.default.orderInfo.create({
        data: { LoginName: req.user.loginName, AddressID: addressID, ProviderName: providerName, AccountID: accountID }
    });
    const shopGroups = skus.reduce((acc, sku) => {
        const shop = sku.productInfo.LoginName;
        if (!acc[shop])
            acc[shop] = [];
        acc[shop].push(sku);
        return acc;
    }, {});
    for (const shop in shopGroups) {
        const subOrder = await prisma_1.default.subOrderInfo.create({
            data: { OrderID: order.OrderID, DeliveryMethodName: 'Standard', DeliveryProviderName: 'Default', ActualDate: new Date(), ExpectedDate: new Date() }
        });
        for (const sku of shopGroups[shop]) {
            await prisma_1.default.subOrderDetail.create({
                data: { OrderID: order.OrderID, SubOrderID: subOrder.SubOrderID, ProductID: sku.ProductID, SKUName: sku.SKUName, Quantity: sku.Quantity }
            });
        }
    }
    res.json(order);
});
exports.default = router;
