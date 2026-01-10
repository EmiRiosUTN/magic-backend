import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service';

const categoriesService = new CategoriesService();

export class CategoriesController {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const language = (req as any).language || 'es';
            const categories = await categoriesService.getAll(language);
            res.json({ categories });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const language = (req as any).language || 'es';
            const category = await categoriesService.getById(id, language);
            res.json(category);
        } catch (error) {
            if (error instanceof Error && error.message === 'Category not found') {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const category = await categoriesService.create(req.body);
            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const category = await categoriesService.update(id, req.body);
            res.json(category);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const result = await categoriesService.delete(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
