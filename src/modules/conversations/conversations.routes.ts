import { Router } from 'express';
import { ConversationsController } from './conversations.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import {
    getConversationsSchema,
    deleteConversationSchema,
    confirmCreateConversationSchema,
} from './conversations.validation';

const router = Router();
const conversationsController = new ConversationsController();

// All routes require authentication
router.get('/', authenticate, validate(getConversationsSchema), conversationsController.getAll.bind(conversationsController));
router.get('/:id', authenticate, conversationsController.getById.bind(conversationsController));
router.post('/', authenticate, validate(confirmCreateConversationSchema), conversationsController.create.bind(conversationsController));
router.delete('/:id', authenticate, validate(deleteConversationSchema), conversationsController.delete.bind(conversationsController));
router.put('/:id/title', authenticate, conversationsController.updateTitle.bind(conversationsController));

export default router;
