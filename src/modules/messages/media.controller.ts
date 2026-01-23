
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class MediaController {
    async getMedia(req: Request, res: Response) {
        try {
            const { messageId } = req.params;

            const media = await prisma.messageMedia.findUnique({
                where: { messageId },
            });

            if (!media) {
                return res.status(404).json({ error: 'Media not found' });
            }

            res.setHeader('Content-Type', media.mimeType);
            res.setHeader('Content-Length', media.data.length);
            res.send(media.data);

        } catch (error) {
            logger.error('Error fetching media:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
