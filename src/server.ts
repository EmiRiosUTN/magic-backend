import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';

const PORT = env.PORT || 3000;

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Start server
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${env.NODE_ENV}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();
