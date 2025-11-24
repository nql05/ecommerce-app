import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth_route';
import buyerRoutes from './routes/buyers_route';
import sellerRoutes from './routes/seller_route';
import adminRoutes from './routes/admin_route';

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger to aid debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/auth', authRoutes);
app.use('/buyer', buyerRoutes);
app.use('/seller', sellerRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
