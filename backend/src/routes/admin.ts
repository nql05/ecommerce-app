import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import adminController from '../controllers/adminController';

const router = express.Router();

router.get('/users', authenticate, authorize(['admin']), adminController.listUsers);
router.put('/users/:loginName', authenticate, authorize(['admin']), adminController.editUser);
router.get('/stats', authenticate, authorize(['admin']), adminController.stats);

export default router;
