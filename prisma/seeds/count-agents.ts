import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const totalAgents = await prisma.agent.count();
    const agentsByCategory = await prisma.category.findMany({
        include: {
            _count: {
                select: { agents: true }
            }
        },
        orderBy: { displayOrder: 'asc' }
    });

    console.log('\n📊 Database Statistics\n');
    console.log(`Total Agents: ${totalAgents}\n`);
    console.log('Agents by Category:');

    for (const category of agentsByCategory) {
        console.log(`  ${category.nameEs}: ${category._count.agents} agents`);
    }
}

main()
    .finally(() => prisma.$disconnect());
