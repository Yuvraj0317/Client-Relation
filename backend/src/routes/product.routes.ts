import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
} from '../validators/product.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all product & inventory routes with JWT authentication
router.use(authenticate);

// Low Stock Alert Catalog (GET /api/products/low-stock)
router.get('/low-stock', ProductController.list);

// POST /api/products (Admin & Warehouse only)
router.post(
  '/',
  authorize('ADMIN', 'WAREHOUSE'),
  validateRequest(createProductSchema),
  ProductController.create
);

// GET /api/products (Authenticated users)
router.get('/', ProductController.list);

// GET /api/products/:id (Authenticated users)
router.get('/:id', ProductController.getById);

// PUT /api/products/:id (Admin & Warehouse only)
router.put(
  '/:id',
  authorize('ADMIN', 'WAREHOUSE'),
  validateRequest(updateProductSchema),
  ProductController.update
);

// DELETE /api/products/:id (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  ProductController.delete
);

// POST /api/products/:id/stock-movement (Admin & Warehouse only)
router.post(
  '/:id/stock-movement',
  authorize('ADMIN', 'WAREHOUSE'),
  validateRequest(stockMovementSchema),
  ProductController.stockMovement
);

// GET /api/products/:id/stock-logs (Authenticated users)
router.get('/:id/stock-logs', ProductController.getStockLogs);

export default router;
