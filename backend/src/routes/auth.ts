import express from 'express';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import prisma from '../mssql/prisma';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { loginName, password, userName, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await prisma.userInfo.create({
    data: { LoginName: loginName, Password: hashedPassword, UserName: userName, ...(role === 'buyer' ? { buyer: { create: {} } } : role === 'seller' ? { seller: { create: { ShopName: `${userName}'s Shop`, CitizenIDCard: '123456789', SellerName: userName } } } : {}) }
  });
  res.json(user);
});

// Login
router.post('/login', async (req, res) => {
  const { loginName, password } = req.body;
  const user = await prisma.userInfo.findUnique({ where: { LoginName: loginName }, include: { Buyer: true, Seller: true } });
  if (!user || !(await comparePassword(password, user.Password))) return res.status(400).json({ error: 'Invalid credentials' });
  const role = user.Buyer ? 'buyer' : user.Seller ? 'seller' : 'admin';
  const token = generateToken({ loginName: user.LoginName, role });
  res.json({ token, role });
});

export default router;
