import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Public login route: POST /api/auth/login
router.post('/login', validateRequest(loginSchema), AuthController.login);

// Protected profile route: GET /api/auth/me
router.get('/me', authenticate, AuthController.me);

// Protected registration route (Admin only)
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validateRequest(registerSchema),
  AuthController.register
);

// Protected test routes for role authorization testing
router.get('/test-admin', authenticate, authorize('ADMIN'), (req, res) => {
  return res.status(200).json({ success: true, message: 'Access granted to ADMIN role' });
});

router.get('/test-sales', authenticate, authorize('SALES'), (req, res) => {
  return res.status(200).json({ success: true, message: 'Access granted to SALES role' });
});

export default router;
