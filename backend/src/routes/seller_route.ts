import express from 'express';
import {authenticate, authorize} from '../middleware/auth';
import sellerController from '../controllers/sellerController';

const router = express.Router();

// See all sellers' products
router.get('/products', authenticate, authorize(['seller']), sellerController.listProducts);

// Add a new product
router.post('/products/add', authenticate, authorize(['seller']), sellerController.addProduct);

// View product details
router.get('/products/:id', authenticate, authorize(['seller']), sellerController.readProduct);

// Edit a product details
router.put('/products/:id', authenticate, authorize(['seller']), sellerController.editProduct);

// Delete a product
router.delete('/products/:id', authenticate, authorize(['seller']), sellerController.removeProduct);

// View earnings
router.get('/earnings', authenticate, authorize(['seller']), sellerController.earnings);

// TODO: Post comment - Future version

export default router;
