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
}
