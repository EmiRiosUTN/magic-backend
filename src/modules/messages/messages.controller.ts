import { Request, Response, NextFunction } from 'express';
import { MessagesService } from './messages.service';


const messagesService = new MessagesService();

export class MessagesController {
    async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { conversationId } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const result = await messagesService.getByConversation(
                conversationId,
                req.user!.userId,
                limit,
                offset
            );

            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Conversation not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;

            const result = await messagesService.sendMessage(
                conversationId,
                req.user!.userId,
                content
            );

            res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error) {
                if (
                    error.message === 'Conversation not found' ||
                    error.message.includes('límite')
                ) {
                    res.status(400).json({ error: error.message });
                } else {
                    next(error);
                }
            } else {
                next(error);
            }
        }
    }

    async downloadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { url } = req.query;

            if (!url || typeof url !== 'string') {
                res.status(400).json({ error: 'URL parameter is required' });
                return;
            }

            // Fetch the image from external source
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Download failed: ${response.status} ${response.statusText}`);
                res.status(400).json({ error: 'Failed to fetch original media' });
                return;
            }

            // Get content type
            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            // Set headers for download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', 'attachment'); // forcing download-popup

            // If we can guess extension, add filename
            const ext = contentType.split('/')[1] || 'bin';
            res.setHeader('Content-Disposition', `attachment; filename="download.${ext}"`);

            // Convert web stream to buffer directly to avoid stream incompatibility issues in Node/Express
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);

        } catch (error) {
            console.error('Download Media Error:', error);
            next(error);
        }
    }
}
