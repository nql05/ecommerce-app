"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth_route"));
const buyers_route_1 = __importDefault(require("./routes/buyers_route"));
const seller_route_1 = __importDefault(require("./routes/seller_route"));
const admin_route_1 = __importDefault(require("./routes/admin_route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/auth', auth_route_1.default);
app.use('/buyers', buyers_route_1.default);
app.use('/seller', seller_route_1.default);
app.use('/admin', admin_route_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
