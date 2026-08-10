import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from '../validators/customer.validator';

const router = Router();

// Protect all customer routes with JWT authentication
router.use(authenticateJWT);

// List customers (All authenticated roles can read)
router.get('/', CustomerController.list);

// Get customer details by ID
router.get('/:id', CustomerController.getById);

// Get customer follow-up notes timeline
router.get('/:id/follow-ups', CustomerController.getFollowUps);

// Create customer (ADMIN, SALES)
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(createCustomerSchema),
  CustomerController.create
);

// Update customer (ADMIN, SALES)
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(updateCustomerSchema),
  CustomerController.update
);

// Add follow-up note (ADMIN, SALES)
router.post(
  '/:id/follow-ups',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(createFollowUpSchema),
  CustomerController.addFollowUp
);

export default router;
