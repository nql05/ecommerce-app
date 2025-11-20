import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import sellerRoutes from './routes/seller';
import adminRoutes from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/seller', sellerRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
