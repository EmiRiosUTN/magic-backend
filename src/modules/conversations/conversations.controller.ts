import { Response, NextFunction } from 'express';
import { ConversationsService } from './conversations.service';
import { AuthRequest } from '../../middleware/auth';

const conversationsService = new ConversationsService();

export class ConversationsController {
    async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { agentId } = req.query;
            const conversations = await conversationsService.getByUser(
                req.user!.userId,
                agentId as string | undefined
            );
            res.json({ conversations });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const conversation = await conversationsService.getById(id, req.user!.userId);
            res.json(conversation);
        } catch (error) {
            if (error instanceof Error && error.message === 'Conversation not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { agentId, title, confirmDelete } = req.body;
            const result = await conversationsService.create(
                req.user!.userId,
                agentId,
                title,
                confirmDelete
            );

            if (result.requiresConfirmation) {
                res.status(200).json({
                    requiresConfirmation: true,
                    warning: result.warning,
                    oldestConversation: result.oldestConversation,
                });
            } else {
                res.status(201).json(result.conversation);
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const result = await conversationsService.delete(id, req.user!.userId);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Conversation not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async updateTitle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { title } = req.body;
            const conversation = await conversationsService.updateTitle(
                id,
                req.user!.userId,
                title
            );
            res.json(conversation);
        } catch (error) {
            if (error instanceof Error && error.message === 'Conversation not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }
}
