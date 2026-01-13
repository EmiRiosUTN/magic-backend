import { Response, NextFunction } from 'express';
import { SectionsService } from './sections.service';
import { AuthRequest } from '../../middleware/auth';
import { createSectionSchema, updateSectionSchema, reorderSectionsSchema } from './sections.dto';

const sectionsService = new SectionsService();

export class SectionsController {
    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createSectionSchema.parse(req.body);
            const section = await sectionsService.create(req.user!.userId, validatedData);
            res.status(201).json(section);
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateSectionSchema.parse(req.body);
            const section = await sectionsService.update(
                req.params.id,
                req.user!.userId,
                validatedData
            );
            res.json(section);
        } catch (error) {
            next(error);
        }
    }

    async reorder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = reorderSectionsSchema.parse(req.body);
            const result = await sectionsService.reorder(req.user!.userId, validatedData);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await sectionsService.delete(req.params.id, req.user!.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
