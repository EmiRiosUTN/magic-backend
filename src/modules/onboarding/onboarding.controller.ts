import { Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service';
import { AuthRequest } from '../../middleware/auth';

const onboardingService = new OnboardingService();

export class OnboardingController {
    async setLanguage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { language } = req.body;
            const settings = await onboardingService.setLanguage(req.user!.userId, language);
            res.json(settings);
        } catch (error) {
            next(error);
        }
    }

    async complete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await onboardingService.completeOnboarding(req.user!.userId);
            res.json({ onboardingCompleted: user.onboardingCompleted });
        } catch (error) {
            next(error);
        }
    }

    async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = await onboardingService.getStatus(req.user!.userId);
            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}
