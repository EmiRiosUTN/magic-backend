import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

const adminService = new AdminService();

export class AdminController {
    async getOverviewStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await adminService.getOverviewStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getUserStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await adminService.getUserStats();
            res.json({ users: stats });
        } catch (error) {
            next(error);
        }
    }

    async getAgentStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await adminService.getAgentStats();
            res.json({ agents: stats });
        } catch (error) {
            next(error);
        }
    }
}
