import { Router } from 'express';
import { SalesChallanController } from '../controllers/salesChallan.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { createChallanSchema } from '../validators/salesChallan.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all delivery challan routes with JWT authentication
router.use(authenticate);

// POST /api/challans & /api/sales-challans (Admin & Sales)
router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  validateRequest(createChallanSchema),
  SalesChallanController.create
);

// GET /api/challans & /api/sales-challans (Authenticated users)
router.get('/', SalesChallanController.list);

// GET /api/challans/:id & /api/sales-challans/:id (Authenticated users)
router.get('/:id', SalesChallanController.getById);

// POST & PATCH /api/challans/:id/confirm (Admin, Warehouse, Sales)
router.post(
  '/:id/confirm',
  authorize('ADMIN', 'WAREHOUSE', 'SALES'),
  SalesChallanController.confirm
);

router.patch(
  '/:id/confirm',
  authorize('ADMIN', 'WAREHOUSE', 'SALES'),
  SalesChallanController.confirm
);

// POST & PATCH /api/challans/:id/cancel (Admin, Accounts)
router.post(
  '/:id/cancel',
  authorize('ADMIN', 'ACCOUNTS'),
  SalesChallanController.cancel
);

router.patch(
  '/:id/cancel',
  authorize('ADMIN', 'ACCOUNTS'),
  SalesChallanController.cancel
);

export default router;
