import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Solo patrones MUY específicos de agentes claramente inválidos
const invalidNamePatterns = [
    /^ramones$/i,
    /^postmortem$/i,
    /^illustration for teenagers/i,
    /^Недвижимость$/i,
    /side silhouette of a young person/i,
    /^A blonde woman in a dreamy$/i,
    /^A Half-Built Pyramid/i,
    /^Amateur Mirror Selfie/i,
];

// Patrones en system prompts que CLARAMENTE indican que es una conversación específica
const clearlyInvalidPromptPatterns = [
    /^quiero mejorar este montaje fotográfico/i,
    /^create a new markdown file that as a postmortem/i,
    /^\${subject} rendered in/i, // Image generation templates
    /^\${current_weather} in a gravity-defying/i, // Weather templates
    /^Thoughtful Islamic book cover illustration/i,
    /^A modern apartment in Montenegro/i,
];

async function main() {
    console.log('\n🔍 ANALIZANDO AGENTES...\n');

    const agents = await prisma.agent.findMany({
        include: { category: true },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`📋 Total agentes: ${agents.length}\n`);

    const toDelete: string[] = [];
    const seen = new Map<string, any>(); // key -> first agent

    for (const agent of agents) {
        let shouldDelete = false;
        let reason = '';

        // 1. Check ONLY clearly invalid name patterns
        for (const pattern of invalidNamePatterns) {
            if (pattern.test(agent.nameEs) || pattern.test(agent.nameEn)) {
                shouldDelete = true;
                reason = `Nombre claramente inválido: ${agent.nameEs}`;
                break;
            }
        }

        // 2. Check ONLY clearly invalid system prompts
        if (!shouldDelete) {
            for (const pattern of clearlyInvalidPromptPatterns) {
                if (pattern.test(agent.systemPrompt)) {
                    shouldDelete = true;
                    reason = `System prompt claramente inválido`;
                    break;
                }
            }
        }

        // 3. Check for exact duplicates (same name)
        const key = `${agent.nameEs.toLowerCase()}_${agent.nameEn.toLowerCase()}`;
        if (!shouldDelete) {
            if (seen.has(key)) {
                const first = seen.get(key);
                // Keep the one with better system prompt (longer usually = better)
                if (agent.systemPrompt.length < first.systemPrompt.length) {
                    shouldDelete = true;
                    reason = `Duplicado (peor que ${first.id})`;
                } else {
                    // This one is better, delete the previous one
                    toDelete.push(first.id);
                    console.log(`❌ ${first.nameEs} (${first.id}) - Duplicado inferior`);
                    seen.set(key, agent);
                }
            } else {
                seen.set(key, agent);
            }
        }

        if (shouldDelete) {
            toDelete.push(agent.id);
            console.log(`❌ ${agent.nameEs} (${agent.id}) - ${reason}`);
        }
    }

    console.log(`\n\n📊 RESUMEN:`);
    console.log(`   Total agentes: ${agents.length}`);
    console.log(`   A eliminar: ${toDelete.length}`);
    console.log(`   Quedarán: ${agents.length - toDelete.length}`);

    if (toDelete.length === 0) {
        console.log('\n✅ No hay agentes para eliminar');
        return;
    }

    console.log('\n⚠️  ¿Proceder con la eliminación? (Ctrl+C para cancelar)');
    console.log('Esperando 5 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Eliminando agentes...\n');

    const result = await prisma.agent.deleteMany({
        where: {
            id: {
                in: toDelete
            }
        }
    });

    console.log(`\n✅ Eliminados ${result.count} agentes`);
    console.log(`✅ Quedan ${agents.length - result.count} agentes válidos\n`);

    // Regenerate embeddings after cleanup
    console.log('💡 Recuerda regenerar los embeddings: npx tsx src/scripts/generate-embeddings.ts\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
