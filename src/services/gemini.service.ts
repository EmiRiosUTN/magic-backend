import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

export class GeminiService {
    async chat(
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        model: string = 'gemini-pro'
    ): Promise<{
        content: string;
        tokensUsed: number | null;
    }> {
        try {
            const geminiModel = genAI.getGenerativeModel({ model });

            // Convert messages to Gemini format
            const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
            const history = messages
                .filter((m) => m.role !== 'system')
                .map((m) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                }));

            const lastUserMessage = history.pop();

            if (!lastUserMessage) {
                throw new Error('No user message found');
            }

            const chat = geminiModel.startChat({
                history: history.length > 0 ? history : undefined,
                generationConfig: {
                    maxOutputTokens: 2048,
                },
            });

            // Include system prompt in the first message if exists
            const messageText = systemPrompt
                ? `${systemPrompt}\n\n${lastUserMessage.parts[0].text}`
                : lastUserMessage.parts[0].text;

            const result = await chat.sendMessage(messageText);
            const response = result.response;

            return {
                content: response.text(),
                tokensUsed: null, // Gemini doesn't always provide token count
            };
        } catch (error) {
            logger.error('Gemini API error:', error);
            throw new Error('Failed to get response from Gemini');
        }
    }
}
