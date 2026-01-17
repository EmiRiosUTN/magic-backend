import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';


const usersService = new UsersService();

export class UsersController {
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const profile = await usersService.getProfile(req.user!.userId);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await usersService.updateProfile(req.user!.userId, req.body);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await usersService.getAllUsers();
            res.json({ users });
        } catch (error) {
            next(error);
        }
    }
}
