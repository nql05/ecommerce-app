import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import sellerController from '../controllers/sellerController';

const router = express.Router();

router.get('/', authenticate, authorize(['seller']), sellerController.listProducts);
router.post('/', authenticate, authorize(['seller']), sellerController.addProduct);
router.put('/:id', authenticate, authorize(['seller']), sellerController.editProduct);
router.delete('/:id', authenticate, authorize(['seller']), sellerController.removeProduct);
router.get('/earnings', authenticate, authorize(['seller']), sellerController.earnings);

export default router;
