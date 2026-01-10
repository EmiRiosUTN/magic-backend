import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { sendMessageSchema, getMessagesSchema } from './messages.validation';

const router = Router();
const messagesController = new MessagesController();

// All routes require authentication
router.get('/:conversationId', authenticate, validate(getMessagesSchema), messagesController.getMessages.bind(messagesController));
router.post('/:conversationId', authenticate, validate(sendMessageSchema), messagesController.sendMessage.bind(messagesController));

export default router;
