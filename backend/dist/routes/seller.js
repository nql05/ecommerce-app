"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../mssql/prisma"));
const router = express_1.default.Router();
// Get seller products
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['seller']), async (req, res) => {
    const products = await prisma_1.default.productInfo.findMany({
        where: { LoginName: req.user.loginName },
        include: { SKU: { include: { Comment: true } } }
    });
    res.json(products);
});
// Add product
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['seller']), async (req, res) => {
    const product = await prisma_1.default.productInfo.create({
        data: { ...req.body, LoginName: req.user.loginName }
    });
    res.json(product);
});
// Update product
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['seller']), async (req, res) => {
    const product = await prisma_1.default.productInfo.update({
        where: { ProductID: parseInt(req.params.id) },
        data: req.body
    });
    res.json(product);
});
// Delete product
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['seller']), async (req, res) => {
    await prisma_1.default.productInfo.delete({ where: { ProductID: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
});
// Get earnings
router.get('/earnings', auth_1.authenticate, (0, auth_1.authorize)(['seller']), async (req, res) => {
    const seller = await prisma_1.default.seller.findUnique({ where: { LoginName: req.user.loginName } });
    res.json({ earnings: seller?.MoneyEarned });
});
exports.default = router;
