import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

export const i18nMiddleware = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Default language
        let language = 'es';

        // If user is authenticated, get their language preference
        if (req.user) {
            const settings = await prisma.userSettings.findUnique({
                where: { userId: req.user.userId },
            });

            if (settings) {
                language = settings.language.toLowerCase();
            }
        }

        // Attach language to request
        (req as any).language = language;
        next();
    } catch (error) {
        next(error);
    }
};
