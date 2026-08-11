import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, NotFoundError } from './middlewares/error.middleware';
import { ApiResponse } from './utils/apiResponse';

// Import Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import salesChallanRoutes from './routes/salesChallan.routes';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Route
app.get('/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'OK',
    service: 'Mini ERP + CRM API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Customer CRM Routes
app.use('/api/customers', customerRoutes);
app.use('/api/v1/customers', customerRoutes);

// Product & Inventory Routes
app.use('/api/products', productRoutes);
app.use('/api/v1/products', productRoutes);

// Sales Challan Routes
app.use('/api/challans', salesChallanRoutes);
app.use('/api/sales-challans', salesChallanRoutes);
app.use('/api/v1/sales-challans', salesChallanRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = parseInt(env.PORT, 10) || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Mini ERP Backend Server listening on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
  });
}

export default app;
