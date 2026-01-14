import { prisma } from '../../config/database';
import { OpenAIService } from '../../services/openai.service';
import { GeminiService } from '../../services/gemini.service';

const openaiService = new OpenAIService();
const geminiService = new GeminiService();

export class MessagesService {
    async getByConversation(
        conversationId: string,
        userId: string,
        limit: number = 50,
        offset: number = 0
    ) {
        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            skip: offset,
            take: limit,
        });

        const total = await prisma.message.count({
            where: { conversationId },
        });

        return {
            messages: messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
            })),
            total,
            limit,
            offset,
        };
    }

    async sendMessage(conversationId: string, userId: string, content: string) {
        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
            include: {
                agent: true,
                user: {
                    include: {
                        subscriptionType: true,
                    },
                },
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Check message limit
        const messageLimit =
            conversation.user.subscriptionType?.maxMessagesPerConversation || 100;

        if (conversation.messageCount >= messageLimit) {
            throw new Error(
                `Has alcanzado el límite de ${messageLimit} mensajes para esta conversación`
            );
        }

        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                role: 'USER',
                content,
            },
        });

        // Get conversation history (last N messages to stay within context)
        const historyLimit = 20; // Keep last 20 messages for context
        const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: historyLimit,
        });

        // Reverse to get chronological order
        history.reverse();

        // Build messages array for AI
        const messages = [
            {
                role: 'system' as const,
                content: `${conversation.agent.systemPrompt}

IMPORTANT LANGUAGE INSTRUCTION:
- Detect the language the user is speaking to you (Spanish or English)
- Always respond in the SAME language the user uses
- If the user writes in Spanish, respond in Spanish
- If the user writes in English, respond in English
- Maintain the same language throughout the conversation unless the user switches`,
            },
            ...history.map((msg) => ({
                role: msg.role.toLowerCase() as 'user' | 'assistant',
                content: msg.content,
            })),
        ];

        // Get AI response based on provider
        let aiResponse: { content: string; tokensUsed: number | null };

        if (conversation.agent.aiProvider === 'OPENAI') {
            aiResponse = await openaiService.chat(messages, conversation.agent.modelName);
        } else {
            aiResponse = await geminiService.chat(messages, conversation.agent.modelName);
        }

        // Save assistant message
        const assistantMessage = await prisma.message.create({
            data: {
                conversationId,
                role: 'ASSISTANT',
                content: aiResponse.content,
                tokensUsed: aiResponse.tokensUsed,
            },
        });

        // Update conversation
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                messageCount: { increment: 2 }, // User + Assistant
                lastMessageAt: new Date(),
                title:
                    conversation.messageCount === 0
                        ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
                        : conversation.title,
            },
        });

        return {
            userMessage: {
                id: userMessage.id,
                role: userMessage.role,
                content: userMessage.content,
                createdAt: userMessage.createdAt,
            },
            assistantMessage: {
                id: assistantMessage.id,
                role: assistantMessage.role,
                content: assistantMessage.content,
                createdAt: assistantMessage.createdAt,
            },
        };
    }
}
