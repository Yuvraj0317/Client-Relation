import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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

// Healthcheck & Root Endpoints: GET & HEAD for /, /health, /api, /api/health
const rootHealthHandler = (req: express.Request, res: express.Response) => {
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  return ApiResponse.success(res, {
    status: 'OK',
    service: 'Mini ERP + CRM API Gateway',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

app.all(['/health', '/api/health'], (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return rootHealthHandler(req, res);
  }
  next();
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

// Stock Movements Routes
app.use('/api/stock', stockRoutes);
app.use('/api/v1/stock', stockRoutes);

// Sales Challan Routes
app.use('/api/challans', salesChallanRoutes);
app.use('/api/sales-challans', salesChallanRoutes);
app.use('/api/v1/sales-challans', salesChallanRoutes);

// Serve Frontend Static Bundle if built (Single-Service Deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // If frontend is separate, root GET/HEAD returns health check JSON
  app.all(['/', '/api'], (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return rootHealthHandler(req, res);
    }
    next();
  });
}

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
