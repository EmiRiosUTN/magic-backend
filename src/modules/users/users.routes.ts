import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();
const usersController = new UsersController();

// User routes
router.get('/me', authenticate, usersController.getProfile.bind(usersController));
router.put('/me', authenticate, usersController.updateProfile.bind(usersController));

// Admin routes
router.get('/', authenticate, requireAdmin, usersController.getAllUsers.bind(usersController));

export default router;
