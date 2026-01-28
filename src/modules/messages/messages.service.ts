import { prisma } from '../../config/database';
import { OpenAIService } from '../../services/openai.service';
import { GeminiService } from '../../services/gemini.service';
import { logger } from '../../utils/logger';

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

    async sendMessage(conversationId: string, userId: string, content: string, media?: { buffer: Buffer, mimeType: string }) {
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

        const globalMessageCount = await prisma.message.count({
            where: {
                role: 'USER',
                conversation: {
                    userId: userId
                }
            }
        });

        const GLOBAL_LIMIT = 30;
        if (globalMessageCount >= GLOBAL_LIMIT) {
            throw new Error(
                `Has alcanzado el límite global de ${GLOBAL_LIMIT} consultas permitidas en total.`
            );
        }

        const lastMessage = await prisma.message.findFirst({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
        });

        if (lastMessage &&
            lastMessage.role === 'USER' &&
            lastMessage.content === content &&
            (new Date().getTime() - lastMessage.createdAt.getTime() < 60000)
        ) {
            throw new Error('Please wait, the previous message is still being processed.');
        }

        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                role: 'USER',
                content,
                media: media ? {
                    create: {
                        mimeType: media.mimeType,
                        data: media.buffer
                    }
                } : undefined
            },
        });

        // Get conversation history (last N messages to stay within context)
        const historyLimit = 20; // Keep last 20 messages for context
        const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: historyLimit,
            include: { media: true },
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
                media: msg.media ? {
                    mimeType: msg.media.mimeType,
                    data: msg.media.data
                } : undefined
            })),
        ];

        const toolsConfig = conversation.agent.toolsConfig as { tools?: string[] } | null;
        if (conversation.agent.hasTools && toolsConfig?.tools?.includes('generateImage')) {
            try {
                const { content: textContent, media } = await geminiService.generateImage(messages);

                const sanitizedContent = textContent.replace(/!\[Generated Image\]\(.*?\)/g, '').trim();

                let finalContent = sanitizedContent;
                const mediaData = media.length > 0 ? media[0] : null;

                const { userMessageResponse, assistantMessageResponse } = await prisma.$transaction(async (tx: any) => {
                    const assistantMessage = await tx.message.create({
                        data: {
                            conversationId,
                            role: 'ASSISTANT',
                            content: finalContent,
                            tokensUsed: 0,
                        },
                    });

                    if (mediaData) {
                        // Create media relation manually
                        await tx.messageMedia.create({
                            data: {
                                messageId: assistantMessage.id,
                                mimeType: mediaData.mimeType,
                                data: mediaData.data
                            }
                        });

                        const port = process.env.PORT || 3000;
                        const baseUrl = process.env.NODE_ENV === 'production'
                            ? 'https://api.chicasguapas.ai'
                            : `http://localhost:${port}`;

                        const imageUrl = `${baseUrl}/api/messages/${assistantMessage.id}/media`;
                        finalContent += `\n\n![Generated Image](${imageUrl})`;

                        await tx.message.update({
                            where: { id: assistantMessage.id },
                            data: { content: finalContent }
                        });

                        assistantMessage.content = finalContent;
                    }

                    await tx.conversation.update({
                        where: { id: conversationId },
                        data: {
                            messageCount: { increment: 2 },
                            lastMessageAt: new Date(),
                            title: conversation.messageCount === 0
                                ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
                                : conversation.title,
                        },
                    });

                    return {
                        userMessageResponse: {
                            id: userMessage.id,
                            role: userMessage.role,
                            content: userMessage.content,
                            createdAt: userMessage.createdAt,
                        },
                        assistantMessageResponse: {
                            id: assistantMessage.id,
                            role: assistantMessage.role,
                            content: assistantMessage.content,
                            createdAt: assistantMessage.createdAt,
                        },
                    };
                });

                return {
                    userMessage: userMessageResponse,
                    assistantMessage: assistantMessageResponse,
                };

            } catch (error: any) {
                console.error('CRITICAL GENERATION ERROR:', error);
                // Detailed logging to find out WHY it failed despite finding media
                if (error instanceof Error) {
                    logger.error(`Generation transaction failed: ${error.message}\nStack: ${error.stack}`);
                }

                const errorMessage = "Lo siento, hubo un error generando la imagen. Por favor intenta de nuevo.";

                const assistantMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        role: 'ASSISTANT',
                        content: errorMessage,
                        tokensUsed: 0,
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

        if (conversation.agent.hasTools && toolsConfig?.tools?.includes('generateVideo')) {
            try {
                // Extract prompt from last user message
                const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user');
                const prompt = lastUserMsg ? lastUserMsg.content : messages[messages.length - 1].content;

                const { content: textContent, media } = await geminiService.generateVideo(prompt);

                const sanitizedContent = textContent.replace(/!\[Generated Video\]\(.*?\)/g, '').trim();

                let finalContent = sanitizedContent;
                const mediaData = media.length > 0 ? media[0] : null;

                const { userMessageResponse, assistantMessageResponse } = await prisma.$transaction(async (tx: any) => {
                    const assistantMessage = await tx.message.create({
                        data: {
                            conversationId,
                            role: 'ASSISTANT',
                            content: finalContent,
                            tokensUsed: 0,
                        },
                    });

                    if (mediaData) {
                        // Create media relation manually
                        await tx.messageMedia.create({
                            data: {
                                messageId: assistantMessage.id,
                                mimeType: mediaData.mimeType,
                                data: mediaData.data
                            }
                        });

                        const port = process.env.PORT || 3000;
                        const baseUrl = process.env.NODE_ENV === 'production'
                            ? 'https://api.chicasguapas.ai'
                            : `http://localhost:${port}`;

                        // Append #.mp4 so frontend detects it as video
                        const videoUrl = `${baseUrl}/api/messages/${assistantMessage.id}/media#.mp4`;
                        finalContent += `\n\n![Generated Video](${videoUrl})`;

                        await tx.message.update({
                            where: { id: assistantMessage.id },
                            data: { content: finalContent }
                        });

                        assistantMessage.content = finalContent;
                    }

                    await tx.conversation.update({
                        where: { id: conversationId },
                        data: {
                            messageCount: { increment: 2 },
                            lastMessageAt: new Date(),
                            title: conversation.messageCount === 0
                                ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
                                : conversation.title,
                        },
                    });

                    return {
                        userMessageResponse: {
                            id: userMessage.id,
                            role: userMessage.role,
                            content: userMessage.content,
                            createdAt: userMessage.createdAt,
                        },
                        assistantMessageResponse: {
                            id: assistantMessage.id,
                            role: assistantMessage.role,
                            content: assistantMessage.content,
                            createdAt: assistantMessage.createdAt,
                        },
                    };
                });

                return {
                    userMessage: userMessageResponse,
                    assistantMessage: assistantMessageResponse,
                };

            } catch (error: any) {
                console.error('CRITICAL VIDEO GENERATION ERROR:', error);
                if (error instanceof Error) {
                    logger.error(`Video Generation transaction failed: ${error.message}\nStack: ${error.stack}`);
                }

                const errorMessage = "Lo siento, hubo un error generando el video. Por favor intenta de nuevo.";

                const assistantMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        role: 'ASSISTANT',
                        content: errorMessage,
                        tokensUsed: 0,
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

        // STANDARD CHAT LOGIC

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
