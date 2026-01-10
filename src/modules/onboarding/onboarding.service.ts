import { prisma } from '../../config/database';

export class OnboardingService {
    async setLanguage(userId: string, language: 'ES' | 'EN') {
        // Update or create user settings
        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: { language },
            create: {
                userId,
                language,
            },
        });

        return settings;
    }

    async completeOnboarding(userId: string) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { onboardingCompleted: true },
        });

        return user;
    }

    async getStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                settings: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            onboardingCompleted: user.onboardingCompleted,
            language: user.settings?.language || 'ES',
        };
    }
}
