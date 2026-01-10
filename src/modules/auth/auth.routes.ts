import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
    loginSchema,
    createUserSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from './auth.validation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));

// Admin only routes
router.post('/register', authenticate, requireAdmin, validate(createUserSchema), authController.register.bind(authController));

export default router;
