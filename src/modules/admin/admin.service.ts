import { prisma } from '../../config/database';

export class AdminService {
    async getOverviewStats() {
        const [totalUsers, activeUsers, totalConversations, totalMessages] =
            await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { isActive: true } }),
                prisma.conversation.count(),
                prisma.message.count(),
            ]);

        // Get most used agent
        const agentUsage = await prisma.conversation.groupBy({
            by: ['agentId'],
            _count: {
                agentId: true,
            },
            orderBy: {
                _count: {
                    agentId: 'desc',
                },
            },
            take: 1,
        });

        let mostUsedAgent = null;
        if (agentUsage.length > 0) {
            const agent = await prisma.agent.findUnique({
                where: { id: agentUsage[0].agentId },
            });

            if (agent) {
                mostUsedAgent = {
                    id: agent.id,
                    nameEs: agent.nameEs,
                    nameEn: agent.nameEn,
                    usageCount: agentUsage[0]._count.agentId,
                };
            }
        }

        return {
            totalUsers,
            activeUsers,
            totalConversations,
            totalMessages,
            mostUsedAgent,
        };
    }

    async getUserStats() {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        conversations: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            conversationCount: user._count.conversations,
            isActive: user.isActive,
            createdAt: user.createdAt,
        }));
    }

    async getAgentStats() {
        const agents = await prisma.agent.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: {
                        conversations: true,
                    },
                },
                category: true,
            },
            orderBy: {
                conversations: {
                    _count: 'desc',
                },
            },
        });

        return agents.map((agent) => ({
            id: agent.id,
            nameEs: agent.nameEs,
            nameEn: agent.nameEn,
            categoryName: agent.category.nameEs,
            conversationCount: agent._count.conversations,
            aiProvider: agent.aiProvider,
        }));
    }
}
