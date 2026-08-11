import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
} from '../validators/product.validator';

const router = Router();

// Protect all product routes with JWT
router.use(authenticateJWT);

// List products
router.get('/', ProductController.list);

// Get low stock alert products
router.get('/low-stock', ProductController.getLowStock);

// Get product details
router.get('/:id', ProductController.getById);

// Get stock movement history log for product
router.get('/:id/stock-logs', ProductController.getStockLogs);

// Create product (ADMIN, WAREHOUSE)
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(createProductSchema),
  ProductController.create
);

// Update product (ADMIN, WAREHOUSE)
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(updateProductSchema),
  ProductController.update
);

// Log manual Stock IN/OUT (ADMIN, WAREHOUSE)
router.post(
  '/:id/stock-movement',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(stockMovementSchema),
  ProductController.logStockMovement
);

export default router;
