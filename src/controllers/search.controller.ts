import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { logger } from '../utils/logger';

const searchService = new SearchService();

/**
 * Search agents using semantic similarity
 * GET /api/search/agents?query=redactor de mails&limit=10
 */
export const searchAgents = async (req: Request, res: Response) => {
    try {
        const { query, limit } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const limitNum = limit ? parseInt(limit as string, 10) : 10;

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
            return res.status(400).json({ error: 'Limit must be between 1 and 50' });
        }

        const results = await searchService.searchAgents(query, limitNum);

        res.json({
            query,
            results,
            count: results.length,
        });
    } catch (error) {
        logger.error('Search agents error:', error);
        res.status(500).json({ error: 'Failed to search agents' });
    }
};

/**
 * Generate embeddings for all agents
 * POST /api/search/generate-embeddings
 * Admin only
 */
export const generateEmbeddings = async (req: Request, res: Response) => {
    try {
        const result = await searchService.generateAllEmbeddings();

        res.json({
            message: 'Embedding generation complete',
            ...result,
        });
    } catch (error) {
        logger.error('Generate embeddings error:', error);
        res.status(500).json({ error: 'Failed to generate embeddings' });
    }
};

/**
 * Generate embedding for a single agent
 * POST /api/search/generate-embedding/:agentId
 * Admin only
 */
export const generateAgentEmbedding = async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;

        await searchService.generateAgentEmbedding(agentId);

        res.json({
            message: 'Embedding generated successfully',
            agentId,
        });
    } catch (error) {
        logger.error('Generate agent embedding error:', error);
        res.status(500).json({ error: 'Failed to generate embedding' });
    }
};
