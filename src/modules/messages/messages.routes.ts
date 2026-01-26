import { Router } from 'express';
import multer from 'multer';
import { MessagesController } from './messages.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { sendMessageSchema, getMessagesSchema } from './messages.validation';

import { mediaRoutes } from './media.routes';

const router = Router();
const messagesController = new MessagesController();

// Mount media routes first to avoid ID collisions
router.use('/', mediaRoutes);

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.get('/media/download', authenticate, messagesController.downloadMedia.bind(messagesController));
router.get('/:conversationId', authenticate, validate(getMessagesSchema), messagesController.getMessages.bind(messagesController));
router.post('/:conversationId', authenticate, upload.single('file'), validate(sendMessageSchema), messagesController.sendMessage.bind(messagesController));

export default router;
