import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import highlightedProductRoutes from './routes/highlightedProductRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Static serving for uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/highlighted-products", highlightedProductRoutes);

// MongoDB connection
await connectDB();

app.get('/', (req, res) => res.send('Server is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
