import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../mssql/prisma';

const router = express.Router();

// Get users
router.get('/users', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  const users = await prisma.userInfo.findMany({ include: { Buyer: true, Seller: true } });
  res.json(users);
});

// Update user
router.put('/users/:loginName', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  const user = await prisma.userInfo.update({
    where: { LoginName: req.params.loginName },
    data: req.body
  });
  res.json(user);
});

// Stats
router.get('/stats', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  const userCount = await prisma.userInfo.count();
  const productCount = await prisma.productInfo.count();
  const orderCount = await prisma.orderInfo.count();
  res.json({ userCount, productCount, orderCount });
});

export default router;
