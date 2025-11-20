import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import productController from '../controllers/productController';

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);

router.post('/cart', authenticate, authorize(['buyer']), productController.addToCart);
router.get('/cart', authenticate, authorize(['buyer']), productController.getCart);
router.put('/cart', authenticate, authorize(['buyer']), productController.updateCart);

router.post('/order', authenticate, authorize(['buyer']), productController.createOrder);
router.post('/my_product', authenticate, authorize(['seller']), productController.listProducts);


export default router;
