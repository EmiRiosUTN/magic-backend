import { Request, Response, NextFunction } from 'express';
import { AgentsService } from './agents.service';
import { AuthRequest } from '../../middleware/auth';

const agentsService = new AgentsService();

export class AgentsController {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const language = (req as any).language || 'es';
            const agents = await agentsService.getAll(language);
            res.json({ agents });
        } catch (error) {
            next(error);
        }
    }

    async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { categoryId } = req.query;
            const language = (req as any).language || 'es';
            const agents = await agentsService.getByCategory(categoryId as string, language);
            res.json({ agents });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const language = (req as any).language || 'es';
            const agent = await agentsService.getById(id, language);
            res.json(agent);
        } catch (error) {
            if (error instanceof Error && error.message === 'Agent not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const agent = await agentsService.create(req.body, req.user!.userId);
            res.status(201).json(agent);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const agent = await agentsService.update(id, req.body);
            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const result = await agentsService.delete(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
