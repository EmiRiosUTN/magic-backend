import { Router, RequestHandler } from 'express';
import { searchAgents, generateEmbeddings, generateAgentEmbedding } from '../controllers/search.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public search endpoint
router.get('/agents', authenticate as RequestHandler, searchAgents);

// Admin-only embedding generation endpoints
router.post('/generate-embeddings', authenticate as RequestHandler, requireAdmin as RequestHandler, generateEmbeddings);
router.post('/generate-embedding/:agentId', authenticate as RequestHandler, requireAdmin as RequestHandler, generateAgentEmbedding);

export default router;
