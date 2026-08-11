import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from '../validators/customer.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all CRM routes with JWT authentication middleware
router.use(authenticate);

// POST /api/customers (Admin & Sales only)
router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  validateRequest(createCustomerSchema),
  CustomerController.create
);

// GET /api/customers (Authenticated users)
router.get('/', CustomerController.list);

// GET /api/customers/:id (Authenticated users)
router.get('/:id', CustomerController.getById);

// PUT /api/customers/:id (Admin & Sales only)
router.put(
  '/:id',
  authorize('ADMIN', 'SALES'),
  validateRequest(updateCustomerSchema),
  CustomerController.update
);

// DELETE /api/customers/:id (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  CustomerController.delete
);

// POST /api/customers/:id/followups & /follow-ups (Admin & Sales only)
router.post(
  '/:id/followups',
  authorize('ADMIN', 'SALES'),
  validateRequest(createFollowUpSchema),
  CustomerController.addFollowUp
);

router.post(
  '/:id/follow-ups',
  authorize('ADMIN', 'SALES'),
  validateRequest(createFollowUpSchema),
  CustomerController.addFollowUp
);

// GET /api/customers/:id/followups & /follow-ups (Authenticated users)
router.get('/:id/followups', CustomerController.getFollowUps);
router.get('/:id/follow-ups', CustomerController.getFollowUps);

export default router;
