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

            const messageText = systemPrompt
                ? `${systemPrompt}\n\n${lastUserMessage.parts[0].text}`
                : lastUserMessage.parts[0].text;

            const result = await chat.sendMessage(messageText);
            const response = result.response;

            return {
                content: response.text(),
                tokensUsed: null,
            };
        } catch (error) {
            logger.error('Gemini API error:', error);
            throw new Error('Failed to get response from Gemini');
        }
    }

    async generateImage(messages: Array<{ role: string; content: string }>): Promise<{ content: string; media: { mimeType: string; data: Buffer }[] }> {
        try {
            const modelName = "gemini-2.5-flash-image";
            const apiKey = env.GEMINI_API_KEY;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            // Extract system prompt
            const systemMessage = messages.find(m => m.role === 'system');
            const systemPrompt = systemMessage ? systemMessage.content : '';

            // Filter out system message from history for the contents array
            // Map roles: 'user' -> 'user', 'assistant' -> 'model'
            const contents = messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));

            const payload = {
                contents: contents,
                system_instruction: systemPrompt ? {
                    parts: [{ text: systemPrompt }]
                } : undefined,
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                    speechConfig: undefined
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();

                if (response.status === 429) {
                    throw new Error("Google AI Quota Exceeded (429). The 'Nano Banana' model may require a paid account or you have hit the free tier limit. See: https://ai.google.dev/pricing");
                }

                throw new Error(`Gemini API Error ${response.status}: ${errText}`);
            }

            const data = await response.json() as any;
            const parts = data.candidates?.[0]?.content?.parts || [];

            if (parts.length === 0) {
                throw new Error('No content returned from Gemini');
            }

            let content = "";
            const media: { mimeType: string; data: Buffer }[] = [];

            for (const part of parts) {
                if (part.text) {
                    content += part.text + "\n";
                }

                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const buffer = Buffer.from(base64Data, 'base64');

                    media.push({
                        mimeType,
                        data: buffer
                    });
                }
            }

            return {
                content: content || "No response content generated.",
                media
            };

        } catch (error: any) {
            logger.error('Gemini Image Generation error:', error);
            throw new Error(`Failed to generate image with Gemini: ${error.message}`);
        }
    }
}
