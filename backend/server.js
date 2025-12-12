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
app.use(cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization"
  }));

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
// Listen on all network interfaces (0.0.0.0) so mobile devices can access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
  if (process.env.PUBLIC_BASE_URL) {
    console.log(`Mobile access: ${process.env.PUBLIC_BASE_URL}`);
  } else {
    console.log('⚠️  PUBLIC_BASE_URL not set - mobile image loading may not work correctly');
  }
});
