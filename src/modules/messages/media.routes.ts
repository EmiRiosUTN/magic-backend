
import { Router } from 'express';
import { MediaController } from './media.controller';

const router = Router();
const mediaController = new MediaController();

// GET /api/messages/:messageId/media
router.get('/:messageId/media', mediaController.getMedia);

export const mediaRoutes = router;
