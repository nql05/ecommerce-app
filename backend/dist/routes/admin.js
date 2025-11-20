"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const adminController_1 = __importDefault(require("../controllers/adminController"));
const router = express_1.default.Router();
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)(['admin']), adminController_1.default.listUsers);
router.put('/users/:loginName', auth_1.authenticate, (0, auth_1.authorize)(['admin']), adminController_1.default.editUser);
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(['admin']), adminController_1.default.stats);
exports.default = router;
