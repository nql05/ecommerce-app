"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../mssql/prisma"));
const router = express_1.default.Router();
// Get users
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)(['admin']), async (req, res) => {
    const users = await prisma_1.default.userInfo.findMany({ include: { Buyer: true, Seller: true } });
    res.json(users);
});
// Update user
router.put('/users/:loginName', auth_1.authenticate, (0, auth_1.authorize)(['admin']), async (req, res) => {
    const user = await prisma_1.default.userInfo.update({
        where: { LoginName: req.params.loginName },
        data: req.body
    });
    res.json(user);
});
// Stats
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(['admin']), async (req, res) => {
    const userCount = await prisma_1.default.userInfo.count();
    const productCount = await prisma_1.default.productInfo.count();
    const orderCount = await prisma_1.default.orderInfo.count();
    res.json({ userCount, productCount, orderCount });
});
exports.default = router;
