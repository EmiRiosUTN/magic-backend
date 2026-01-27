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
            notificationEmail: user.settings?.notificationEmail,
            messageCount: await prisma.message.count({
                where: {
                    role: 'USER',
                    conversation: {
                        userId: user.id
                    }
                }
            })
        };
    }

    async updateProfile(userId: string, data: { fullName?: string; notificationEmail?: string; language?: 'ES' | 'EN' }) {
        // Update user's basic info if provided
        if (data.fullName) {
            await prisma.user.update({
                where: { id: userId },
                data: { fullName: data.fullName },
            });
        }

        // Update or create user settings if language or notificationEmail provided
        if (data.language !== undefined || data.notificationEmail !== undefined) {
            await prisma.userSettings.upsert({
                where: { userId },
                update: {
                    ...(data.language !== undefined && { language: data.language }),
                    ...(data.notificationEmail !== undefined && { notificationEmail: data.notificationEmail }),
                },
                create: {
                    userId,
                    language: data.language || 'ES',
                    notificationEmail: data.notificationEmail,
                },
            });
        }

        // Return updated user profile
        return this.getProfile(userId);
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
