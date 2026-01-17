import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.agent.findMany({
        include: { category: true },
        orderBy: { nameEs: 'asc' }
    });

    console.log(`\n📋 Total agentes: ${agents.length}\n`);
    console.log('='.repeat(100));

    agents.forEach((a, i) => {
        console.log(`\n${i + 1}. ID: ${a.id}`);
        console.log(`   Nombre (ES): ${a.nameEs}`);
        console.log(`   Nombre (EN): ${a.nameEn}`);
        console.log(`   Categoría: ${a.category.nameEs}`);
        console.log(`   Descripción: ${a.descriptionEs?.substring(0, 80) || 'N/A'}...`);
        console.log('-'.repeat(100));
    });

    console.log('\n✅ Listado completo\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
