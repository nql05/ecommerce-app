"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const seller_1 = __importDefault(require("./routes/seller"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
app.use('/products', products_1.default);
app.use('/seller', seller_1.default);
app.use('/admin', admin_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
