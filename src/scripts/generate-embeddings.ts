import { PrismaClient } from '@prisma/client';
import { SearchService } from '../services/search.service';

const prisma = new PrismaClient();
const searchService = new SearchService();

async function main() {
    console.log('🚀 Starting embedding generation for all agents...\n');

    try {
        const result = await searchService.generateAllEmbeddings();

        console.log('\n✅ Embedding generation complete!');
        console.log(`   Generated: ${result.generated} agents`);
        console.log(`   Skipped: ${result.skipped} agents`);
    } catch (error) {
        console.error('❌ Error generating embeddings:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
