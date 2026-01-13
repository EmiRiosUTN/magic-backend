import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All routes require admin access
router.get('/stats/overview', authenticate, requireAdmin, adminController.getOverviewStats.bind(adminController));
router.get('/stats/users', authenticate, requireAdmin, adminController.getUserStats.bind(adminController));
router.get('/stats/agents', authenticate, requireAdmin, adminController.getAgentStats.bind(adminController));
router.post('/email-config', authenticate, requireAdmin, adminController.updateEmailConfig.bind(adminController));

export default router;
