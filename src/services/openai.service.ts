import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class OpenAIService {
    async chat(messages: ChatMessage[], model: string = 'gpt-4o-mini'): Promise<{
        content: string;
        tokensUsed: number;
    }> {
        try {
            const response = await openai.chat.completions.create({
                model,
                messages,
            });

            return {
                content: response.choices[0].message.content || '',
                tokensUsed: response.usage?.total_tokens || 0,
            };
        } catch (error) {
            logger.error('OpenAI API error:', error);
            throw new Error('Failed to get response from OpenAI');
        }
    }
}
