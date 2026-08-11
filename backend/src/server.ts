import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, NotFoundError } from './middlewares/error.middleware';
import { ApiResponse } from './utils/apiResponse';

// Import Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import salesChallanRoutes from './routes/salesChallan.routes';

const app = express();

// Production CORS Middleware Configuration
const allowedOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Endpoint: GET /health & GET /api/health
const healthHandler = (req: express.Request, res: express.Response) => {
  return ApiResponse.success(res, {
    status: 'OK',
    service: 'Mini ERP + CRM API Gateway',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Authentication Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Customer CRM Routes
app.use('/api/customers', customerRoutes);
app.use('/api/v1/customers', customerRoutes);

// Product & Inventory Routes
app.use('/api/products', productRoutes);
app.use('/api/v1/products', productRoutes);

// Stock Movements Routes
app.use('/api/stock', stockRoutes);
app.use('/api/v1/stock', stockRoutes);

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
