import { Router } from 'express';
import { searchAgents, generateEmbeddings, generateAgentEmbedding } from '../controllers/search.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public search endpoint
router.get('/agents', authenticate, searchAgents);

// Admin-only embedding generation endpoints
router.post('/generate-embeddings', authenticate, requireAdmin, generateEmbeddings);
router.post('/generate-embedding/:agentId', authenticate, requireAdmin, generateAgentEmbedding);

export default router;
