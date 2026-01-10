import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await authService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            await authService.resetPassword(token, newPassword);
            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }
}
