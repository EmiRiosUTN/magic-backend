import { prisma } from '../../config/database';

export class ConversationsService {
    async getByUser(userId: string, agentId?: string) {
        const where: any = { userId };
        if (agentId) {
            where.agentId = agentId;
        }

        const conversations = await prisma.conversation.findMany({
            where,
            include: {
                agent: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            messageCount: conv.messageCount,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt,
            agent: {
                id: conv.agent.id,
                nameEs: conv.agent.nameEs,
                nameEn: conv.agent.nameEn,
            },
        }));
    }

    async getById(id: string, userId: string) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                agent: true,
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return conversation;
    }

    async checkLimit(userId: string, agentId: string): Promise<{
        canCreate: boolean;
        warning?: string;
        oldestConversation?: {
            id: string;
            title: string;
        };
    }> {
        // Get user's subscription limits
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscriptionType: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const limit = user.subscriptionType?.maxConversationsPerAgent || 5;

        // Count existing conversations for this agent
        const existingCount = await prisma.conversation.count({
            where: {
                userId,
                agentId,
            },
        });

        if (existingCount >= limit) {
            // Get oldest conversation
            const oldest = await prisma.conversation.findFirst({
                where: {
                    userId,
                    agentId,
                },
                orderBy: { createdAt: 'asc' },
            });

            return {
                canCreate: true,
                warning: `Has alcanzado el límite de ${limit} conversaciones para este agente. La conversación "${oldest?.title || 'Sin título'}" será eliminada al crear una nueva.`,
                oldestConversation: oldest
                    ? {
                        id: oldest.id,
                        title: oldest.title || 'Sin título',
                    }
                    : undefined,
            };
        }

        return {
            canCreate: true,
        };
    }

    async create(
        userId: string,
        agentId: string,
        title?: string,
        confirmDelete: boolean = false
    ) {
        // Check if agent exists
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        // Check limit
        const limitCheck = await this.checkLimit(userId, agentId);

        if (limitCheck.warning && !confirmDelete) {
            // Return warning without creating
            return {
                requiresConfirmation: true,
                warning: limitCheck.warning,
                oldestConversation: limitCheck.oldestConversation,
            };
        }

        // If limit reached, delete oldest
        if (limitCheck.oldestConversation) {
            await prisma.conversation.delete({
                where: { id: limitCheck.oldestConversation.id },
            });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                userId,
                agentId,
                title: title || 'Nueva conversación',
            },
            include: {
                agent: true,
            },
        });

        return {
            requiresConfirmation: false,
            conversation: {
                id: conversation.id,
                title: conversation.title,
                agentId: conversation.agentId,
                createdAt: conversation.createdAt,
            },
        };
    }

    async delete(id: string, userId: string) {
        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        await prisma.conversation.delete({
            where: { id },
        });

        return { message: 'Conversation deleted successfully' };
    }

    async updateTitle(id: string, userId: string, title: string) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const updated = await prisma.conversation.update({
            where: { id },
            data: { title },
        });

        return updated;
    }
}
