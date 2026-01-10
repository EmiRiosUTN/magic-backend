import { Router } from 'express';
import { AgentsController } from './agents.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { i18nMiddleware } from '../../middleware/i18n';
import {
    createAgentSchema,
    updateAgentSchema,
    getAgentsByCategorySchema,
    deleteAgentSchema,
} from './agents.validation';

const router = Router();
const agentsController = new AgentsController();

// User routes (with i18n)
router.get('/', authenticate, i18nMiddleware, agentsController.getAll.bind(agentsController));
router.get('/by-category', authenticate, i18nMiddleware, validate(getAgentsByCategorySchema), agentsController.getByCategory.bind(agentsController));
router.get('/:id', authenticate, i18nMiddleware, agentsController.getById.bind(agentsController));

// Admin only routes
router.post('/', authenticate, requireAdmin, validate(createAgentSchema), agentsController.create.bind(agentsController));
router.put('/:id', authenticate, requireAdmin, validate(updateAgentSchema), agentsController.update.bind(agentsController));
router.delete('/:id', authenticate, requireAdmin, validate(deleteAgentSchema), agentsController.delete.bind(agentsController));

export default router;
