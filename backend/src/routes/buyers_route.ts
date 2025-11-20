import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import buyerController from '../controllers/buyerController';

const router = express.Router();

router.get('/products', buyerController.listProducts);
router.get('/products/:id', buyerController.getProductDetails);

router.post('/cart', authenticate, authorize(['buyer']), buyerController.addToCart);
router.get('/cart', authenticate, authorize(['buyer']), buyerController.getCart);
router.put('/cart', authenticate, authorize(['buyer']), buyerController.updateCart);
router.delete('/cart', authenticate, authorize(['buyer']), buyerController.removeFromCart);

router.post('/order/create', authenticate, authorize(['buyer']), buyerController.createOrder);
router.post('/order/:id', authenticate, authorize(['seller']), buyerController.listProducts);


export default router;
