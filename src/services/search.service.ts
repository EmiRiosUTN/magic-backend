import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../services/openai.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const openaiService = new OpenAIService();

interface AgentWithSimilarity {
    id: string;
    categoryId: string;
    nameEs: string;
    nameEn: string;
    descriptionEs: string | null;
    descriptionEn: string | null;
    similarity: number;
}

export class SearchService {
    /**
     * Search agents using semantic similarity
     */
    async searchAgents(query: string, limit: number = 10): Promise<AgentWithSimilarity[]> {
        try {
            // 1. Generate embedding for search query
            const queryEmbedding = await openaiService.generateEmbedding(query);

            // 2. Get all agents with embeddings
            const agents = await prisma.agent.findMany({
                where: {
                    isActive: true,
                },
                select: {
                    id: true,
                    categoryId: true,
                    nameEs: true,
                    nameEn: true,
                    descriptionEs: true,
                    descriptionEn: true,
                    embedding: true,
                },
            });

            // 3. Calculate similarity scores (filter out agents without embeddings)
            const results: AgentWithSimilarity[] = agents
                .filter(agent => agent.embedding && agent.embedding.length > 0)
                .map((agent) => {

                    const similarity = openaiService.cosineSimilarity(
                        queryEmbedding,
                        agent.embedding as number[]
                    );

                    return {
                        id: agent.id,
                        categoryId: agent.categoryId,
                        nameEs: agent.nameEs,
                        nameEn: agent.nameEn,
                        descriptionEs: agent.descriptionEs,
                        descriptionEn: agent.descriptionEn,
                        similarity,
                    };
                })
                .filter((result): result is AgentWithSimilarity => result !== null);

            // 4. Sort by similarity (highest first) and return top results
            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
        } catch (error) {
            logger.error('Search error:', error);
            throw new Error('Failed to search agents');
        }
    }

    /**
     * Generate and store embedding for an agent
     */
    async generateAgentEmbedding(agentId: string): Promise<void> {
        try {
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
            });

            if (!agent) {
                throw new Error('Agent not found');
            }

            // Combine name and description in both languages for better context
            const embeddingText = `${agent.nameEs} ${agent.nameEn} ${agent.descriptionEs || ''} ${agent.descriptionEn || ''}`.trim();

            // Generate embedding
            const embedding = await openaiService.generateEmbedding(embeddingText);

            // Store in database
            await prisma.agent.update({
                where: { id: agentId },
                data: {
                    embedding,
                    embeddingText,
                },
            });

            logger.info(`Generated embedding for agent: ${agent.nameEs}`);
        } catch (error) {
            logger.error(`Failed to generate embedding for agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * Generate embeddings for all agents that don't have one
     */
    async generateAllEmbeddings(): Promise<{ generated: number; skipped: number }> {
        try {
            // Get all agents (we'll filter by empty embedding in code)
            const allAgents = await prisma.agent.findMany();

            // Filter agents that don't have embeddings
            const agents = allAgents.filter(agent =>
                !agent.embedding || (agent.embedding as number[]).length === 0
            );

            let generated = 0;
            let skipped = 0;

            for (const agent of agents) {
                try {
                    await this.generateAgentEmbedding(agent.id);
                    generated++;
                } catch (error) {
                    logger.error(`Skipping agent ${agent.id}:`, error);
                    skipped++;
                }
            }

            logger.info(`Embedding generation complete: ${generated} generated, ${skipped} skipped`);
            return { generated, skipped };
        } catch (error) {
            logger.error('Failed to generate all embeddings:', error);
            throw error;
        }
    }
}
