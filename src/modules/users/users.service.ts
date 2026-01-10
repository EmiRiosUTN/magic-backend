import { prisma } from '../../config/database';

export class UsersService {
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptionType: true,
                settings: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            onboardingCompleted: user.onboardingCompleted,
            subscriptionType: user.subscriptionType,
            language: user.settings?.language || 'ES',
        };
    }

    async updateProfile(userId: string, data: { fullName?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
        });

        return user;
    }

    async getAllUsers() {
        const users = await prisma.user.findMany({
            include: {
                subscriptionType: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive,
            onboardingCompleted: user.onboardingCompleted,
            subscriptionType: user.subscriptionType,
            createdAt: user.createdAt,
        }));
    }
}
