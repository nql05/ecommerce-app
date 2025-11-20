import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../mssql/prisma';

const router = express.Router();

// Get seller products
router.get('/', authenticate, authorize(['seller']), async (req: AuthRequest, res) => {
  const products = await prisma.productInfo.findMany({
    where: { LoginName: req.user.loginName },
    include: { SKU: { include: { Comment: true } } }
  });
  res.json(products);
});

// Add product
router.post('/', authenticate, authorize(['seller']), async (req: AuthRequest, res) => {
  const product = await prisma.productInfo.create({
    data: { ...req.body, LoginName: req.user.loginName }
  });
  res.json(product);
});

// Update product
router.put('/:id', authenticate, authorize(['seller']), async (req: AuthRequest, res) => {
  const product = await prisma.productInfo.update({
    where: { ProductID: parseInt(req.params.id) },
    data: req.body
  });
  res.json(product);
});

// Delete product
router.delete('/:id', authenticate, authorize(['seller']), async (req: AuthRequest, res) => {
  await prisma.productInfo.delete({ where: { ProductID: parseInt(req.params.id) } });
  res.json({ message: 'Deleted' });
});

// Get earnings
router.get('/earnings', authenticate, authorize(['seller']), async (req: AuthRequest, res) => {
  const seller = await prisma.seller.findUnique({ where: { LoginName: req.user.loginName } });
  res.json({ earnings: seller?.MoneyEarned });
});

export default router;
