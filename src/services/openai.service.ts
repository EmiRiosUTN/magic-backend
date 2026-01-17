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

    /**
     * Generate embedding vector for text using OpenAI's text-embedding-3-small model
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });

            return response.data[0].embedding;
        } catch (error: any) {
            logger.error('OpenAI Embedding API error:', {
                message: error?.message,
                status: error?.status,
                type: error?.type,
                code: error?.code,
                error: error
            });
            throw new Error(`Failed to generate embedding: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     * Returns a value between -1 and 1, where 1 means identical
     */
    cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
