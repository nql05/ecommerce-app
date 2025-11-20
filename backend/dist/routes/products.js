"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const productController_1 = __importDefault(require("../controllers/productController"));
const router = express_1.default.Router();
router.get('/', productController_1.default.listProducts);
router.get('/:id', productController_1.default.getProductDetails);
router.post('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), productController_1.default.addToCart);
router.get('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), productController_1.default.getCart);
router.put('/cart', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), productController_1.default.updateCart);
router.post('/order', auth_1.authenticate, (0, auth_1.authorize)(['buyer']), productController_1.default.createOrder);
exports.default = router;
