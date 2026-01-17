import { Request, Response, NextFunction } from 'express';
import { CardsService } from './cards.service';

import { createCardSchema, updateCardSchema, moveCardSchema, reorderCardsSchema } from './cards.dto';

const cardsService = new CardsService();

export class CardsController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createCardSchema.parse(req.body);
            const card = await cardsService.create(req.user!.userId, validatedData);
            res.status(201).json(card);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateCardSchema.parse(req.body);
            const card = await cardsService.update(
                req.params.id,
                req.user!.userId,
                validatedData
            );
            res.json(card);
        } catch (error) {
            next(error);
        }
    }

    async move(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = moveCardSchema.parse(req.body);
            const result = await cardsService.move(
                req.params.id,
                req.user!.userId,
                validatedData
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = reorderCardsSchema.parse(req.body);
            const result = await cardsService.reorder(req.user!.userId, validatedData);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await cardsService.delete(req.params.id, req.user!.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
