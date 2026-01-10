import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { setLanguageSchema } from './onboarding.validation';

const router = Router();
const onboardingController = new OnboardingController();

// All routes require authentication
router.get('/status', authenticate, onboardingController.getStatus.bind(onboardingController));
router.post('/language', authenticate, validate(setLanguageSchema), onboardingController.setLanguage.bind(onboardingController));
router.post('/complete', authenticate, onboardingController.complete.bind(onboardingController));

export default router;
