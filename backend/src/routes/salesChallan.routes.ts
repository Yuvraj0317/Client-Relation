import { Router } from 'express';
import { SalesChallanController } from '../controllers/salesChallan.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createSalesChallanSchema } from '../validators/salesChallan.validator';

const router = Router();

// Protect all sales challan routes with JWT
router.use(authenticateJWT);

// List sales challans
router.get('/', SalesChallanController.list);

// Get sales challan by ID
router.get('/:id', SalesChallanController.getById);

// Create Draft Sales Challan (ADMIN, SALES)
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(createSalesChallanSchema),
  SalesChallanController.createDraft
);

// Confirm Sales Challan & Deduct Stock (ADMIN, SALES, WAREHOUSE)
router.patch(
  '/:id/confirm',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE'),
  SalesChallanController.confirm
);

// Cancel Sales Challan & Restore Stock (ADMIN, ACCOUNTS)
router.patch(
  '/:id/cancel',
  authorizeRoles('ADMIN', 'ACCOUNTS'),
  SalesChallanController.cancel
);

export default router;
