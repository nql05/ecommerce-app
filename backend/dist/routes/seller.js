"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const sellerController_1 = __importDefault(require("../controllers/sellerController"));
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['seller']), sellerController_1.default.listProducts);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['seller']), sellerController_1.default.addProduct);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['seller']), sellerController_1.default.editProduct);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['seller']), sellerController_1.default.removeProduct);
router.get('/earnings', auth_1.authenticate, (0, auth_1.authorize)(['seller']), sellerController_1.default.earnings);
exports.default = router;
