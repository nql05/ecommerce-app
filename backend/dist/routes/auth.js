"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../utils/auth");
const prisma_1 = __importDefault(require("../mssql/prisma"));
const router = express_1.default.Router();
// Register
router.post('/register', async (req, res) => {
    const { loginName, password, userName, role } = req.body;
    const hashedPassword = await (0, auth_1.hashPassword)(password);
    const user = await prisma_1.default.userInfo.create({
        data: { LoginName: loginName, Password: hashedPassword, UserName: userName, ...(role === 'buyer' ? { buyer: { create: {} } } : role === 'seller' ? { seller: { create: { ShopName: `${userName}'s Shop`, CitizenIDCard: '123456789', SellerName: userName } } } : {}) }
    });
    res.json(user);
});
// Login
router.post('/login', async (req, res) => {
    const { loginName, password } = req.body;
    const user = await prisma_1.default.userInfo.findUnique({ where: { LoginName: loginName }, include: { Buyer: true, Seller: true } });
    if (!user || !(await (0, auth_1.comparePassword)(password, user.Password)))
        return res.status(400).json({ error: 'Invalid credentials' });
    const role = user.Buyer ? 'buyer' : user.Seller ? 'seller' : 'admin';
    const token = (0, auth_1.generateToken)({ loginName: user.LoginName, role });
    res.json({ token, role });
});
exports.default = router;
